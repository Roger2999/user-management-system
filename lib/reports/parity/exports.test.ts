import { describe, expect, it } from "vitest";
import {
  buildSiteUserTableRows,
  type SiteUserTotals,
} from "../assembly/section-traces";
import { formatInteger } from "../format";
import { SPY_MAY_EXPORTS } from "./exports.fixture";

/**
 * Paridad de formato y de denominador contra la herramienta de origen.
 *
 * Lo que se verifica acá es lo que se puede verificar sin el `access.log`: que,
 * dadas las mismas filas y el mismo total, el motor emita exactamente los mismos
 * textos y en el mismo orden que WebSpy.
 *
 * Lo que NO se verifica acá: que el motor calcule esas filas desde el log. Eso
 * es la paridad numérica (T10), que necesita el log del mismo período.
 */
describe("paridad contra los exports de WebSpy (mayo 2026)", () => {
  for (const entry of SPY_MAY_EXPORTS) {
    it(`reproduce el drill-down de ${entry.site}`, () => {
      const totals: SiteUserTotals[] = entry.users.map((user, index) => ({
        site: entry.site,
        username: `usuario-${String(index).padStart(2, "0")}`,
        hits: user.hits,
        bytesIn: user.bytesIn,
        elapsedMs: user.elapsedMs,
        browsingMs: user.browsingMs,
      }));

      // Se entra desordenado a propósito: el orden de la tabla lo decide el motor.
      const desordenadas = [...totals].sort((a, b) => a.hits - b.hits);

      const rows = buildSiteUserTableRows(desordenadas, {
        basisMs: entry.total.browsingMs,
      });

      expect(rows).toHaveLength(entry.users.length);
      expect(rows.map((row) => row.username)).toEqual(
        entry.users.map((_user, index) => `usuario-${String(index).padStart(2, "0")}`),
      );
      expect(rows.map((row) => row.hits)).toEqual(
        entry.users.map((user) => formatInteger(user.hits)),
      );
      expect(rows.map((row) => row.percentOfBrowsingTime)).toEqual(
        entry.users.map((user) => user.percent),
      );
    });
  }

  it("el denominador es el total del sitio, no la suma de las diez filas", () => {
    // En todos los sitios la fila `Total` del export supera la suma visible: si
    // el denominador fuera la suma de las diez filas, los porcentajes subirían.
    for (const entry of SPY_MAY_EXPORTS) {
      const sumaVisible = entry.users.reduce(
        (sum, user) => sum + user.browsingMs,
        0,
      );

      expect(entry.total.browsingMs).toBeGreaterThanOrEqual(sumaVisible);
    }
  });
});
