import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  createSquidLogLineReader,
  parseSquidLogLine,
} from "./squid-log";

const FIXTURE_PATH = fileURLToPath(
  new URL("./fixtures/squid-access-sample.log", import.meta.url),
);

function readFixtureLines(): string[] {
  return readFileSync(FIXTURE_PATH, "utf8")
    .split("\n")
    .filter((line) => line.trim().length > 0);
}

describe("fragmento real de access.log", () => {
  it("tiene las 12 líneas aportadas por el especialista", () => {
    expect(readFixtureLines()).toHaveLength(12);
  });

  it("parsea todas las líneas, incluidas las dos formas de CONNECT", () => {
    const read = createSquidLogLineReader();
    const parsed = readFixtureLines().map((line) => read(line));

    expect(parsed.filter((item) => item === null)).toHaveLength(0);
    expect(parsed.map((item) => item?.shape)).toEqual([
      "primary",
      "primary",
      "primary",
      "primary",
      "legacy_connect",
      "primary",
      "primary",
      "primary",
      "primary",
      "primary",
      "primary",
      "primary",
    ]);
  });

  it("interpreta la variante CONNECT sin estado ni tamaño", () => {
    const parsed = createSquidLogLineReader()(readFixtureLines()[4]);

    expect(parsed?.shape).toBe("legacy_connect");
    expect(parsed?.record).toEqual({
      timestampMs: 1717070404556,
      elapsedMs: 4210,
      clientIp: "10.10.20.45",
      squidStatus: "CONNECT",
      httpStatus: null,
      bytes: 0,
      method: "CONNECT",
      url: "github.com:443",
      username: null,
      hierarchy: "HIER_DIRECT",
      contentType: "",
    });
  });

  it("mantiene la lectura primaria para el CONNECT completo", () => {
    const parsed = createSquidLogLineReader()(readFixtureLines()[7]);

    expect(parsed?.shape).toBe("primary");
    expect(parsed?.record).toMatchObject({
      squidStatus: "TCP_TUNNEL",
      httpStatus: 200,
      bytes: 6120,
      method: "CONNECT",
      url: "outlook.office365.com:443",
      username: "maria.gomez",
      hierarchy: "HIER_DIRECT",
    });
  });

  it("conserva el usuario del AD y distingue el que no se autenticó", () => {
    const lines = readFixtureLines();

    expect(parseSquidLogLine(lines[2])?.username).toBe("juan.perez");
    expect(parseSquidLogLine(lines[0])?.username).toBeNull();
  });

  it("conserva los estados de Squid que aparecen en el fragmento", () => {
    const statuses = readFixtureLines().map(
      (line) => parseSquidLogLine(line)?.squidStatus,
    );

    expect(statuses).toEqual([
      "TCP_MISS",
      "TCP_MEM_HIT",
      "TCP_MISS",
      "TCP_REFRESH_MODIFIED",
      "CONNECT",
      "TCP_DENIED",
      "TCP_MISS",
      "TCP_TUNNEL",
      "TCP_CLIENT_REFRESH_MISS",
      "TCP_HIT",
      "TCP_MISS",
      "TCP_NEGATIVE_HIT",
    ]);
  });
});
