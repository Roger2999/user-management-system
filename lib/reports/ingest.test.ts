import { Readable } from "node:stream";
import { describe, expect, it } from "vitest";
import { ingestSquidLog } from "./ingest";
import { monthlyPeriod } from "./time";

/** Una línea con el logformat confirmado del especialista. */
function line(timestampMs: number, username = "-"): string {
  return `${Math.floor(timestampMs / 1000)}.000    100 10.0.0.1 TCP_MISS/200 500 GET http://www.uno.cu/ ${username} HIER_DIRECT/1.2.3.4 text/html`;
}

function stream(lines: string[]): Readable {
  return Readable.from([`${lines.join("\n")}\n`]);
}

const JUNE = monthlyPeriod(2026, 6);

/** 1 de junio 12:00 en La Habana (UTC-4). */
const JUNE_1 = Date.UTC(2026, 5, 1, 16, 0, 0);
/** 2 de junio 09:00 en La Habana. */
const JUNE_2 = Date.UTC(2026, 5, 2, 13, 0, 0);
/** 31 de mayo 23:30 en La Habana: ya es 1 de junio en UTC. */
const MAY_31 = Date.UTC(2026, 5, 1, 3, 30, 0);

describe("ingestSquidLog", () => {
  it("acumula cada día local por separado", async () => {
    const result = await ingestSquidLog(
      stream([line(JUNE_1), line(JUNE_1), line(JUNE_2)]),
      { period: JUNE },
    );

    expect(result.days.map((day) => day.day)).toEqual([
      "2026-06-01",
      "2026-06-02",
    ]);
    expect(result.days.map((day) => day.totalHits)).toEqual([2, 1]);
  });

  it("declara los días fuera del período en vez de sumarlos", async () => {
    const result = await ingestSquidLog(stream([line(MAY_31), line(JUNE_1)]), {
      period: JUNE,
    });

    expect(result.days.map((day) => day.day)).toEqual(["2026-06-01"]);
    expect(result.days[0].totalHits).toBe(1);
    expect(result.outsidePeriod).toEqual([{ day: "2026-05-31", hits: 1 }]);
  });

  it("cuenta las líneas inválidas y los hits sin cuenta", async () => {
    const result = await ingestSquidLog(
      stream([line(JUNE_1), "linea que no es de squid", line(JUNE_1, "ana")]),
      { period: JUNE },
    );

    expect(result.stats).toEqual({
      linesTotal: 3,
      linesInvalid: 1,
      linesLegacyConnect: 0,
    });
    expect(result.days[0].unidentifiedHits).toBe(1);
    expect(result.days[0].totalHits).toBe(2);
  });

  it("declara el primer y el último instante de los registros válidos", async () => {
    const result = await ingestSquidLog(
      stream([line(JUNE_1), "invalida", line(MAY_31), line(JUNE_2)]),
      { period: JUNE },
    );

    // Los días ajenos al período también son contenido del archivo.
    expect(result.firstEventAt).toBe(MAY_31);
    expect(result.lastEventAt).toBe(JUNE_2);
  });

  it("no inventa instantes cuando no hay registros válidos", async () => {
    const result = await ingestSquidLog(stream(["invalida"]), { period: JUNE });

    expect(result.firstEventAt).toBeNull();
    expect(result.lastEventAt).toBeNull();
  });
});
