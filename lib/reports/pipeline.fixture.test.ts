import { createReadStream } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { DailyMetricsAccumulator } from "./metrics/aggregate";
import { parseSquidLogStream } from "./parser/squid-log";
import { toLocalDay } from "./time";

const FIXTURE_PATH = fileURLToPath(
  new URL("./parser/fixtures/squid-access-sample.log", import.meta.url),
);

/**
 * Prueba de extremo a extremo del motor puro: archivo → parser → agregación.
 *
 * Los valores esperados se calcularon a mano sobre el fragmento real, así que
 * este test falla si cualquiera de las dos capas cambia una definición.
 */
describe("pipeline sobre el fragmento real", () => {
  it("agrega el día completo sin perder líneas", async () => {
    const accumulator = new DailyMetricsAccumulator("2024-05-30");
    const days = new Map<string, number>();

    const stats = await parseSquidLogStream(createReadStream(FIXTURE_PATH), {
      onRecord: (record) => {
        accumulator.add(record);
        const day = toLocalDay(record.timestampMs);
        days.set(day, (days.get(day) ?? 0) + 1);
      },
    });

    expect(stats.linesTotal).toBe(12);
    expect(stats.linesInvalid).toBe(0);
    expect(stats.linesLegacyConnect).toBe(1);

    const metrics = accumulator.toMetrics();

    expect(metrics.totalHits).toBe(12);
    expect(metrics.totalBytesIn).toBe(52780);
    expect(metrics.totalElapsedMs).toBe(11247);
    expect(metrics.totalBytesOut).toBe(0);
    expect(metrics.unidentifiedHits).toBe(10);

    expect(metrics.users).toHaveLength(3);
    expect(metrics.sites).toHaveLength(12);

    // Todas las líneas del fragmento caen en el mismo día local.
    expect([...days.keys()]).toEqual(["2024-05-30"]);
  });

  it("atribuye los bytes a la cuenta que se autenticó", async () => {
    const accumulator = new DailyMetricsAccumulator("2024-05-30");

    await parseSquidLogStream(createReadStream(FIXTURE_PATH), {
      onRecord: (record) => accumulator.add(record),
    });

    const byUsername = new Map(
      accumulator
        .toMetrics()
        .users.map((user) => [user.username, user.bytesIn]),
    );

    expect(byUsername.get("juan.perez")).toBe(341);
    expect(byUsername.get("maria.gomez")).toBe(6120);
    expect(byUsername.get(null)).toBe(46319);
  });
});
