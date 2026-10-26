import { describe, expect, it } from "vitest";
import { readDocumentXml, replaceDocumentXml } from "./docx";
import { crc32, readZip, writeZip } from "./zip";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function entry(name: string, content: string) {
  return { name, data: encoder.encode(content) };
}

const DOCUMENT_XML =
  '<?xml version="1.0" encoding="UTF-8"?><w:document><w:body><w:p/></w:body></w:document>';

function sampleDocx(): Uint8Array {
  return writeZip([
    entry("[Content_Types].xml", "<Types/>"),
    entry("word/document.xml", DOCUMENT_XML),
    entry("word/styles.xml", "<Styles/>"),
    entry("word/media/image1.png", "PNG-FALSO"),
  ]);
}

describe("crc32", () => {
  it("coincide con el valor conocido de '123456789'", () => {
    expect(crc32(encoder.encode("123456789"))).toBe(0xcbf43926);
  });
});

describe("readZip / writeZip", () => {
  it("hace ida y vuelta conservando nombres, orden y contenido", () => {
    const entries = [
      entry("[Content_Types].xml", "<Types/>"),
      entry("word/document.xml", DOCUMENT_XML),
      entry("word/media/vacio.bin", ""),
      entry("word/media/grande.txt", "x".repeat(200_000)),
    ];

    const restored = readZip(writeZip(entries));

    expect(restored.map((item) => item.name)).toEqual(
      entries.map((item) => item.name),
    );
    for (const [index, item] of restored.entries()) {
      expect(decoder.decode(item.data)).toBe(
        decoder.decode(entries[index].data),
      );
    }
  });

  it("es determinista: el mismo contenido da los mismos bytes", () => {
    expect(writeZip([entry("a.xml", "<a/>")])).toEqual(
      writeZip([entry("a.xml", "<a/>")]),
    );
  });

  it("falla con un buffer que no es ZIP", () => {
    expect(() => readZip(encoder.encode("no soy un zip"))).toThrow(/ZIP/);
  });
});

describe("docx", () => {
  it("lee la parte del documento", () => {
    expect(readDocumentXml(sampleDocx())).toBe(DOCUMENT_XML);
  });

  it("reemplaza el documento y conserva las demás partes", () => {
    const nuevo = "<w:document><w:body><w:p>nuevo</w:p></w:body></w:document>";
    const result = replaceDocumentXml(sampleDocx(), nuevo);
    const entries = readZip(result);

    expect(readDocumentXml(result)).toBe(nuevo);
    expect(entries.map((item) => item.name)).toEqual([
      "[Content_Types].xml",
      "word/document.xml",
      "word/styles.xml",
      "word/media/image1.png",
    ]);
    expect(decoder.decode(entries[2].data)).toBe("<Styles/>");
    expect(decoder.decode(entries[3].data)).toBe("PNG-FALSO");
  });

  it("falla si el .docx no tiene word/document.xml", () => {
    const sinDocumento = writeZip([entry("[Content_Types].xml", "<Types/>")]);

    expect(() => readDocumentXml(sinDocumento)).toThrow(/word\/document\.xml/);
    expect(() => replaceDocumentXml(sinDocumento, "<x/>")).toThrow(
      /word\/document\.xml/,
    );
  });
});
