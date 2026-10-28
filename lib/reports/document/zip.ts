import { deflateRawSync, inflateRawSync } from "node:zlib";

/**
 * Lector y escritor del contenedor ZIP que usa `.docx`.
 *
 * Se implementa acá en vez de agregar una dependencia por la misma razón que
 * `table-xml.ts` no usa un parser XML: el subconjunto que necesitamos es chico y
 * está acotado (métodos `store` y `deflate`, sin cifrado, sin ZIP64, sin
 * descriptores de datos). Un `.docx` de 288 KB entra completo en memoria, así
 * que no hace falta streaming.
 *
 * Lo que sí se cuida es lo que rompe archivos: los offsets del directorio
 * central, el CRC-32 de cada entrada y el nombre exacto de cada parte. Todo eso
 * está cubierto por tests y por una verificación contra el documento real.
 */

const LOCAL_HEADER_SIGNATURE = 0x04034b50;
const CENTRAL_HEADER_SIGNATURE = 0x02014b50;
const END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;

const LOCAL_HEADER_SIZE = 30;
const CENTRAL_HEADER_SIZE = 46;
const END_OF_CENTRAL_DIRECTORY_SIZE = 22;

const METHOD_STORE = 0;
const METHOD_DEFLATE = 8;

/**
 * Marca de tiempo fija (1980-01-01 00:00:00) en formato MS-DOS.
 *
 * Es deliberado: dos exportaciones del mismo contenido tienen que dar el mismo
 * archivo byte a byte. La fecha del ZIP no aporta nada al informe y volvería el
 * resultado imposible de comparar.
 */
const FIXED_DOS_TIME = 0;
const FIXED_DOS_DATE = 0x0021;

export type ZipEntry = {
  name: string;
  data: Uint8Array;
};

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);

  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) === 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }

  return table;
})();

export function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;

  for (let index = 0; index < data.length; index += 1) {
    crc = CRC_TABLE[(crc ^ data[index]) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function readUint16(view: DataView, offset: number): number {
  return view.getUint16(offset, true);
}

function readUint32(view: DataView, offset: number): number {
  return view.getUint32(offset, true);
}

function findEndOfCentralDirectory(view: DataView): number {
  const last = view.byteLength - END_OF_CENTRAL_DIRECTORY_SIZE;
  const first = Math.max(0, view.byteLength - 0xffff - END_OF_CENTRAL_DIRECTORY_SIZE);

  for (let offset = last; offset >= first; offset -= 1) {
    if (readUint32(view, offset) === END_OF_CENTRAL_DIRECTORY_SIGNATURE) {
      return offset;
    }
  }

  throw new RangeError("no es un archivo ZIP: falta el fin del directorio central");
}

/** Lee todas las entradas de un ZIP en memoria, en el orden del directorio. */
export function readZip(bytes: Uint8Array): ZipEntry[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const eocd = findEndOfCentralDirectory(view);
  const total = readUint16(view, eocd + 10);
  const directoryOffset = readUint32(view, eocd + 16);

  const entries: ZipEntry[] = [];
  let cursor = directoryOffset;

  for (let index = 0; index < total; index += 1) {
    if (readUint32(view, cursor) !== CENTRAL_HEADER_SIGNATURE) {
      throw new RangeError(`directorio central corrupto en la entrada ${index}`);
    }

    const method = readUint16(view, cursor + 10);
    const compressedSize = readUint32(view, cursor + 20);
    const nameLength = readUint16(view, cursor + 28);
    const extraLength = readUint16(view, cursor + 30);
    const commentLength = readUint16(view, cursor + 32);
    const localOffset = readUint32(view, cursor + 42);
    const name = new TextDecoder().decode(
      bytes.subarray(cursor + CENTRAL_HEADER_SIZE, cursor + CENTRAL_HEADER_SIZE + nameLength),
    );

    if (readUint32(view, localOffset) !== LOCAL_HEADER_SIGNATURE) {
      throw new RangeError(`cabecera local corrupta para ${name}`);
    }

    const localNameLength = readUint16(view, localOffset + 26);
    const localExtraLength = readUint16(view, localOffset + 28);
    const dataStart = localOffset + LOCAL_HEADER_SIZE + localNameLength + localExtraLength;
    const raw = bytes.subarray(dataStart, dataStart + compressedSize);

    let data: Uint8Array;
    if (method === METHOD_STORE) {
      data = raw;
    } else if (method === METHOD_DEFLATE) {
      data = inflateRawSync(raw);
    } else {
      throw new RangeError(`método de compresión no soportado (${method}) en ${name}`);
    }

    entries.push({ name, data });
    cursor += CENTRAL_HEADER_SIZE + nameLength + extraLength + commentLength;
  }

  return entries;
}

function writeUint16(view: DataView, offset: number, value: number): void {
  view.setUint16(offset, value, true);
}

function writeUint32(view: DataView, offset: number, value: number): void {
  view.setUint32(offset, value, true);
}

/**
 * Escribe un ZIP con las entradas dadas, en ese orden.
 *
 * Siempre comprime con `deflate`. El contenido es lo que importa: un `.docx`
 * reescrito no es idéntico byte a byte al original, pero cada parte descomprime
 * al mismo contenido, que es lo que verifica la identidad del documento.
 */
export function writeZip(entries: readonly ZipEntry[]): Uint8Array {
  const encoder = new TextEncoder();
  const prepared = entries.map((entry) => {
    const name = encoder.encode(entry.name);
    const compressed = deflateRawSync(entry.data, { level: 6 });
    return {
      name,
      compressed,
      uncompressedSize: entry.data.length,
      crc: crc32(entry.data),
    };
  });

  const localSize = prepared.reduce(
    (sum, entry) => sum + LOCAL_HEADER_SIZE + entry.name.length + entry.compressed.length,
    0,
  );
  const centralSize = prepared.reduce(
    (sum, entry) => sum + CENTRAL_HEADER_SIZE + entry.name.length,
    0,
  );

  const output = new Uint8Array(
    localSize + centralSize + END_OF_CENTRAL_DIRECTORY_SIZE,
  );
  const view = new DataView(output.buffer);
  const offsets: number[] = [];
  let cursor = 0;

  for (const entry of prepared) {
    offsets.push(cursor);
    writeUint32(view, cursor, LOCAL_HEADER_SIGNATURE);
    writeUint16(view, cursor + 4, 20);
    writeUint16(view, cursor + 6, 0x0800);
    writeUint16(view, cursor + 8, METHOD_DEFLATE);
    writeUint16(view, cursor + 10, FIXED_DOS_TIME);
    writeUint16(view, cursor + 12, FIXED_DOS_DATE);
    writeUint32(view, cursor + 14, entry.crc);
    writeUint32(view, cursor + 18, entry.compressed.length);
    writeUint32(view, cursor + 22, entry.uncompressedSize);
    writeUint16(view, cursor + 26, entry.name.length);
    writeUint16(view, cursor + 28, 0);

    output.set(entry.name, cursor + LOCAL_HEADER_SIZE);
    output.set(entry.compressed, cursor + LOCAL_HEADER_SIZE + entry.name.length);
    cursor += LOCAL_HEADER_SIZE + entry.name.length + entry.compressed.length;
  }

  const directoryOffset = cursor;

  prepared.forEach((entry, index) => {
    writeUint32(view, cursor, CENTRAL_HEADER_SIGNATURE);
    writeUint16(view, cursor + 4, 20);
    writeUint16(view, cursor + 6, 20);
    writeUint16(view, cursor + 8, 0x0800);
    writeUint16(view, cursor + 10, METHOD_DEFLATE);
    writeUint16(view, cursor + 12, FIXED_DOS_TIME);
    writeUint16(view, cursor + 14, FIXED_DOS_DATE);
    writeUint32(view, cursor + 16, entry.crc);
    writeUint32(view, cursor + 20, entry.compressed.length);
    writeUint32(view, cursor + 24, entry.uncompressedSize);
    writeUint16(view, cursor + 28, entry.name.length);
    writeUint16(view, cursor + 30, 0);
    writeUint16(view, cursor + 32, 0);
    writeUint16(view, cursor + 34, 0);
    writeUint16(view, cursor + 36, 0);
    writeUint32(view, cursor + 38, 0);
    writeUint32(view, cursor + 42, offsets[index]);

    output.set(entry.name, cursor + CENTRAL_HEADER_SIZE);
    cursor += CENTRAL_HEADER_SIZE + entry.name.length;
  });

  writeUint32(view, cursor, END_OF_CENTRAL_DIRECTORY_SIGNATURE);
  writeUint16(view, cursor + 4, 0);
  writeUint16(view, cursor + 6, 0);
  writeUint16(view, cursor + 8, prepared.length);
  writeUint16(view, cursor + 10, prepared.length);
  writeUint32(view, cursor + 12, cursor - directoryOffset);
  writeUint32(view, cursor + 16, directoryOffset);
  writeUint16(view, cursor + 20, 0);

  return output;
}
