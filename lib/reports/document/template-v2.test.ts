import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildReportDocument } from "../report";
import { readDocumentXml } from "./docx";

/**
 * Prueba contra la plantilla real, no contra una sintética.
 *
 * `storage/` está ignorado en git: en CI el archivo no existe y la prueba se
 * salta. En la máquina que despliega, si la plantilla todavía es la v1, falla
 * acá y no en el PDF firmado.
 */
const templatePath = path.join(
  process.cwd(),
  "storage",
  "templates",
  "monthly-report.docx",
);

const hasTemplate = existsSync(templatePath);

describe.skipIf(!hasTemplate)("plantilla oficial v2", () => {
  it("emite las tres tablas y fechas sobre el documento real", async () => {
    const template = await readFile(templatePath);
    const xml = readDocumentXml(template);
    const tables = [...xml.matchAll(/<w:tbl(?:\s[^>]*)?>[\s\S]*?<\/w:tbl>/g)];

    expect(tables).toHaveLength(21);

    const result = readDocumentXml(
      buildReportDocument({
        template,
        traces: {
          topSites: [
            { site: "www.ejemplo.com", browsingTime: "266.34", users: "12" },
          ],
          topUsers: [
            {
              username: "ana",
              fullName: "Ana Pérez",
              browsingTime: "10.05",
            },
          ],
          topDownloads: [
            {
              username: "ana",
              fullName: "Ana Pérez",
              downloaded: "1.50 GB",
            },
          ],
        },
        period: { year: 2026, month: 10 },
        generatedAt: Date.UTC(2026, 10, 3, 14, 0, 0),
        declaration: "Cobertura completa: 31 de 31 días importados.",
      }),
    );

    expect(result).toContain(
      "Informe Mensual de Ciberseguridad. Octubre 2026 v. Final.",
    );
    expect(result).toContain("01/10/2026 al 31/10/2026");
    expect(result).toContain("03/11/2026");
    expect(result).toContain("www.ejemplo.com");
    expect(result).toContain("266.34");
    expect(result).toContain("Ana Pérez");
    expect(result).toContain("1.50 GB");
    expect(result).toContain("Cobertura completa: 31 de 31 días importados.");

    // El ejemplar de octubre no puede sobrevivir a la generación.
    expect(result).not.toContain("No __X__");
    expect(result).not.toContain("___0____");
    expect(result).not.toContain("2 / 11/ 2026");
    expect(result).not.toContain("9/ 11/ 2026");
  });
});
