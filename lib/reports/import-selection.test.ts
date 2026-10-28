import { describe, expect, it } from "vitest";
import {
  filterLogFiles,
  isLogFile,
  relativeName,
  sortLogFiles,
} from "./import-selection";

describe("isLogFile", () => {
  it("acepta .log, .log rotado y .txt", () => {
    expect(isLogFile("squid-2026-10-12.log")).toBe(true);
    expect(isLogFile("access.log.1")).toBe(true);
    expect(isLogFile("access.log.10")).toBe(true);
    expect(isLogFile("notas.txt")).toBe(true);
    expect(isLogFile("SQUID.LOG")).toBe(true);
  });

  it("rechaza comprimidos y archivos que no son logs", () => {
    expect(isLogFile("access.log.gz")).toBe(false);
    expect(isLogFile("foto.png")).toBe(false);
    expect(isLogFile("access.log.bak")).toBe(false);
    expect(isLogFile(".DS_Store")).toBe(false);
  });
});

describe("relativeName", () => {
  it("usa la ruta relativa de la carpeta y cae al nombre base", () => {
    expect(
      relativeName({
        name: "squid-2026-10-12.log",
        webkitRelativePath: "octubre/squid-2026-10-12.log",
      }),
    ).toBe("octubre/squid-2026-10-12.log");
    expect(relativeName({ name: "squid-2026-10-12.log" })).toBe(
      "squid-2026-10-12.log",
    );
    expect(
      relativeName({ name: "squid.log", webkitRelativePath: "   " }),
    ).toBe("squid.log");
  });
});

describe("sortLogFiles", () => {
  it("ordena por fecha con comparación numérica, no alfabética", () => {
    const files = [
      { name: "squid-2026-10-10.log" },
      { name: "squid-2026-10-2.log" },
      { name: "squid-2026-10-1.log" },
    ];

    expect(sortLogFiles(files).map((file) => file.name)).toEqual([
      "squid-2026-10-1.log",
      "squid-2026-10-2.log",
      "squid-2026-10-10.log",
    ]);
  });

  it("usa la ruta relativa para desempatar nombres iguales", () => {
    const files = [
      { name: "access.log", webkitRelativePath: "septiembre/access.log" },
      { name: "access.log", webkitRelativePath: "octubre/access.log" },
    ];

    expect(sortLogFiles(files).map(relativeName)).toEqual([
      "octubre/access.log",
      "septiembre/access.log",
    ]);
  });
});

describe("filterLogFiles", () => {
  it("filtra, ordena y cuenta los ignorados", () => {
    const files = [
      { name: "squid-2026-10-2.log" },
      { name: "foto.png" },
      { name: "squid-2026-10-1.log" },
      { name: "access.log.gz" },
    ];

    const { accepted, ignored } = filterLogFiles(files);

    expect(accepted.map((file) => file.name)).toEqual([
      "squid-2026-10-1.log",
      "squid-2026-10-2.log",
    ]);
    expect(ignored).toBe(2);
  });

  it("no falla con una selección vacía", () => {
    expect(filterLogFiles([])).toEqual({ accepted: [], ignored: 0 });
  });
});
