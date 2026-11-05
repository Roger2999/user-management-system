import { describe, expect, it } from "vitest";
import {
  buildIncidents,
  INCIDENT_LABELS,
  type IncidentSource,
} from "./incidents";

const source = (
  overrides: Partial<IncidentSource> & Pick<IncidentSource, "url" | "category">,
): IncidentSource => ({
  username: null,
  disposition: "CONFIRMED",
  measure: null,
  ...overrides,
});

describe("buildIncidents", () => {
  it("excluye los falsos positivos", () => {
    const rows = buildIncidents([
      source({ url: "www.malware.com", category: "MALWARE" }),
      source({
        url: "www.falso.com",
        category: "ADULT",
        disposition: "FALSE_POSITIVE",
      }),
    ]);

    expect(rows.map((row) => row.url)).toEqual(["www.malware.com"]);
  });

  it("etiqueta la categoría y deja vacío lo que falta", () => {
    const rows = buildIncidents([
      source({
        url: "www.otro.com",
        category: "ANON_PROXY",
        username: "sin.perfil",
        disposition: "PENDING",
      }),
    ]);

    expect(rows[0]).toEqual({
      url: "www.otro.com",
      category: "ANON_PROXY",
      label: INCIDENT_LABELS.ANON_PROXY,
      username: "sin.perfil",
      fullName: "",
      position: "",
      measure: "",
    });
  });

  it("resuelve el nombre desde los perfiles y respeta las mayúsculas", () => {
    const rows = buildIncidents(
      [
        source({
          url: "www.otro.com",
          category: "MINING",
          username: "Ana.Perez",
        }),
      ],
      { "ana.perez": { fullName: "Ana Pérez", position: "Analista" } },
    );

    expect(rows[0]).toMatchObject({
      fullName: "Ana Pérez",
      position: "Analista",
    });
  });

  it("cae en ProxyAccount cuando el perfil no tiene el nombre", () => {
    const rows = buildIncidents(
      [
        source({
          url: "www.otro.com",
          category: "SUBVERSIVE",
          username: "sin.perfil",
          proxyFullName: "Nombre del proxy",
          proxyPosition: "Cargo del proxy",
        }),
      ],
      {},
    );

    expect(rows[0]).toMatchObject({
      fullName: "Nombre del proxy",
      position: "Cargo del proxy",
    });
  });

  it("convierte la medida en una sola línea", () => {
    const rows = buildIncidents([
      source({
        url: "www.otro.com",
        category: "MALWARE",
        measure: "Se bloqueó el sitio.\nSe notificó al usuario.",
      }),
    ]);

    expect(rows[0].measure).toBe("Se bloqueó el sitio. Se notificó al usuario.");
  });

  it("ordena por categoría, sitio y usuario", () => {
    const rows = buildIncidents([
      source({ url: "www.z.com", category: "MINING", username: "b" }),
      source({ url: "www.a.com", category: "MALWARE", username: "a" }),
      source({ url: "www.a.com", category: "ADULT", username: "z" }),
      source({ url: "www.a.com", category: "ADULT", username: "m" }),
    ]);

    expect(
      rows.map((row) => `${row.category}:${row.url}:${row.username}`),
    ).toEqual([
      "ADULT:www.a.com:m",
      "ADULT:www.a.com:z",
      "MINING:www.z.com:b",
      "MALWARE:www.a.com:a",
    ]);
  });
});
