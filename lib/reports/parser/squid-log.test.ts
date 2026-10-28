import { Readable } from "node:stream";
import { describe, expect, it } from "vitest";
import {
  createSquidLogParser,
  parseSquidLogLine,
  parseSquidLogStream,
  STANDARD_SQUID_LOG_COLUMNS,
  type SquidLogColumn,
} from "./squid-log";

const GET_LINE =
  "1696118400.123    452 10.20.30.41 TCP_MISS/200 15234 GET http://www.youtube.com/watch?v=x infojovellanos DIRECT/142.250.0.1 text/html";

const CONNECT_LINE =
  "1696118401.000  120 10.20.30.42 TCP_MISS/200 0 CONNECT www.facebook.com:443 - DIRECT/157.240.0.35 -";

describe("parseSquidLogLine", () => {
  it("interpreta una línea GET del logformat estándar", () => {
    expect(parseSquidLogLine(GET_LINE)).toEqual({
      timestampMs: 1696118400123,
      elapsedMs: 452,
      clientIp: "10.20.30.41",
      squidStatus: "TCP_MISS",
      httpStatus: 200,
      bytes: 15234,
      method: "GET",
      url: "http://www.youtube.com/watch?v=x",
      username: "infojovellanos",
      hierarchy: "DIRECT",
      contentType: "text/html",
    });
  });

  it("interpreta un túnel CONNECT sin usuario autenticado", () => {
    const record = parseSquidLogLine(CONNECT_LINE);

    expect(record?.method).toBe("CONNECT");
    expect(record?.url).toBe("www.facebook.com:443");
    expect(record?.username).toBeNull();
    expect(record?.bytes).toBe(0);
    expect(record?.contentType).toBe("");
  });

  it("rechaza una línea vacía", () => {
    expect(parseSquidLogLine("")).toBeNull();
    expect(parseSquidLogLine("   ")).toBeNull();
  });

  it("rechaza una línea truncada", () => {
    expect(parseSquidLogLine("1696118400.123 452 10.20.30.41 TCP_MISS/200")).toBeNull();
  });

  it("rechaza un timestamp fuera de rango", () => {
    const line = GET_LINE.replace("1696118400.123", "123.456");
    expect(parseSquidLogLine(line)).toBeNull();
  });

  it("rechaza una línea cuyo orden de columnas no coincide con el declarado", () => {
    const swapped =
      "http://www.youtube.com/watch?v=x GET 1696118400.123 452 10.20.30.41 TCP_MISS/200 15234 juan DIRECT/1.2.3.4 text/html";
    expect(parseSquidLogLine(swapped)).toBeNull();
  });
});

describe("createSquidLogParser", () => {
  it("acepta un logformat propio declarando el orden de columnas", () => {
    const columns: SquidLogColumn[] = [
      "url",
      "method",
      "timestamp",
      "elapsed",
      "clientIp",
      "status",
      "bytes",
      "username",
      "hierarchy",
      "contentType",
    ];
    const parse = createSquidLogParser(columns);

    const record = parse(
      "http://www.picta.cu/noticia GET 1696118400.500 12 10.0.0.1 TCP_HIT/200 99 juan DIRECT/1.2.3.4 text/html",
    );

    expect(record).toEqual({
      timestampMs: 1696118400500,
      elapsedMs: 12,
      clientIp: "10.0.0.1",
      squidStatus: "TCP_HIT",
      httpStatus: 200,
      bytes: 99,
      method: "GET",
      url: "http://www.picta.cu/noticia",
      username: "juan",
      hierarchy: "DIRECT",
      contentType: "text/html",
    });
  });

  it("exige la columna timestamp", () => {
    expect(() =>
      createSquidLogParser(["url", "method"] as SquidLogColumn[]),
    ).toThrow();
  });

  it("expone el logformat estándar como default", () => {
    expect(STANDARD_SQUID_LOG_COLUMNS).toHaveLength(10);
    expect(STANDARD_SQUID_LOG_COLUMNS[7]).toBe("username");
  });
});

describe("parseSquidLogStream", () => {
  it("cuenta las líneas inválidas sin abortar el recorrido", async () => {
    const input = Readable.from([
      [
        GET_LINE,
        "basura con muy pocos campos",
        CONNECT_LINE,
        "",
        GET_LINE,
      ].join("\n"),
    ]);
    const records: string[] = [];

    const stats = await parseSquidLogStream(input, {
      onRecord: (record) => records.push(record.url),
    });

    expect(records).toEqual([
      "http://www.youtube.com/watch?v=x",
      "www.facebook.com:443",
      "http://www.youtube.com/watch?v=x",
    ]);
    // La línea en blanco no cuenta como registro; la basura sí queda como inválida.
    expect(stats.linesInvalid).toBe(1);
    expect(stats.linesTotal).toBe(4);
  });
});
