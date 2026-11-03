import { describe, expect, it } from "vitest";
import {
  buildTopDownloads,
  buildTopSites,
  buildTopUsers,
  buildTracesSection,
  TOP_ROWS,
  type SiteTotals,
  type SiteUserTotals,
  type UserTotals,
} from "./section-traces";

const HOUR = 60 * 60 * 1000;
const MEGABYTE = 1024 * 1024;
const GIGABYTE = 1024 * MEGABYTE;

const site = (values: Partial<SiteTotals> & Pick<SiteTotals, "site">): SiteTotals => ({
  hits: 0,
  bytesIn: 0,
  bytesOut: 0,
  elapsedMs: 0,
  browsingMs: 0,
  ...values,
});

const pair = (
  values: Partial<SiteUserTotals> & Pick<SiteUserTotals, "site" | "username">,
): SiteUserTotals => ({
  hits: 0,
  bytesIn: 0,
  elapsedMs: 0,
  browsingMs: 0,
  ...values,
});

const user = (
  values: Partial<UserTotals> & Pick<UserTotals, "username">,
): UserTotals => ({
  hits: 0,
  bytesIn: 0,
  bytesOut: 0,
  elapsedMs: 0,
  browsingMs: 0,
  ...values,
});

describe("buildTopSites", () => {
  it("ordena por Browsing Time, no por hits", () => {
    const rows = buildTopSites(
      [
        site({ site: "muchos-hits.com", hits: 100, browsingMs: 1 * HOUR }),
        site({ site: "mucho-tiempo.com", hits: 1, browsingMs: 5 * HOUR }),
      ],
      [],
    );

    expect(rows.map((row) => row.site)).toEqual([
      "mucho-tiempo.com",
      "muchos-hits.com",
    ]);
  });

  it("excluye la telemetría y recorta a cinco filas", () => {
    const sites = Array.from({ length: 6 }, (_value, index) =>
      site({ site: `sitio${index}.com`, browsingMs: (index + 1) * HOUR }),
    );
    sites.push(site({ site: "telemetria.com", browsingMs: 99 * HOUR, telemetry: true }));

    const rows = buildTopSites(sites, []);

    expect(rows).toHaveLength(TOP_ROWS);
    expect(rows.map((row) => row.site)).toEqual([
      "sitio5.com",
      "sitio4.com",
      "sitio3.com",
      "sitio2.com",
      "sitio1.com",
    ]);
    expect(rows[0].browsingTime).toBe("6.00");
  });

  it("cuenta usuarios distintos por sitio y no el tráfico sin cuenta", () => {
    const rows = buildTopSites(
      [site({ site: "sitio.com", browsingMs: HOUR })],
      [
        pair({ site: "sitio.com", username: "u1" }),
        pair({ site: "sitio.com", username: "u2" }),
        pair({ site: "sitio.com", username: null }),
        pair({ site: "otro.com", username: "u3" }),
      ],
    );

    expect(rows[0].users).toBe("2");
  });

  it("formatea hh.mm con minutos de dos dígitos", () => {
    const rows = buildTopSites(
      [site({ site: "sitio.com", browsingMs: 2 * HOUR + 30 * 60 * 1000 })],
      [],
    );

    expect(rows[0].browsingTime).toBe("2.30");
  });
});

describe("buildTopUsers", () => {
  it("ordena por tiempo de navegación y excluye la cuenta sin identificar", () => {
    const rows = buildTopUsers([
      user({ username: "u1", browsingMs: 3 * HOUR }),
      user({ username: "u2", browsingMs: 5 * HOUR }),
      user({ username: null, browsingMs: 9 * HOUR }),
    ]);

    expect(rows.map((row) => row.username)).toEqual(["u2", "u1"]);
  });

  it("busca el nombre sin distinguir mayúsculas y deja vacío sin perfil", () => {
    const rows = buildTopUsers(
      [
        user({ username: "Ana.Perez", browsingMs: 2 * HOUR }),
        user({ username: "sin.perfil", browsingMs: 1 * HOUR }),
      ],
      {
        "ana.perez": { fullName: "Ana Pérez", position: "Analista" },
      },
    );

    expect(rows[0].fullName).toBe("Ana Pérez");
    expect(rows[1].fullName).toBe("");
  });

  it("recorta a cinco filas", () => {
    const users = Array.from({ length: 7 }, (_value, index) =>
      user({ username: `u${index}`, browsingMs: (index + 1) * HOUR }),
    );

    expect(buildTopUsers(users)).toHaveLength(TOP_ROWS);
  });
});

describe("buildTopDownloads", () => {
  it("ordena por volumen descargado, no por tiempo", () => {
    const rows = buildTopDownloads([
      user({ username: "mucho-tiempo", browsingMs: 9 * HOUR, bytesIn: 1 * MEGABYTE }),
      user({ username: "mucho-volumen", browsingMs: HOUR, bytesIn: 2 * GIGABYTE }),
    ]);

    expect(rows.map((row) => row.username)).toEqual([
      "mucho-volumen",
      "mucho-tiempo",
    ]);
  });

  it("escribe MB por debajo de 1 GiB y GB desde 1 GiB", () => {
    const rows = buildTopDownloads([
      user({ username: "gigas", bytesIn: 2 * GIGABYTE }),
      user({ username: "megas", bytesIn: 500 * MEGABYTE }),
    ]);

    expect(rows[0].downloaded).toBe("2.00 GB");
    expect(rows[1].downloaded).toBe("500.00 MB");
  });
});

describe("buildTracesSection", () => {
  it("arma las tres tablas con los perfiles recibidos", () => {
    const traces = buildTracesSection({
      sites: [site({ site: "sitio.com", browsingMs: HOUR })],
      siteUsers: [pair({ site: "sitio.com", username: "u1" })],
      users: [
        user({
          username: "u1",
          browsingMs: HOUR,
          bytesIn: MEGABYTE,
        }),
      ],
      profiles: {
        u1: { fullName: "Ana Pérez", position: "Analista" },
      },
    });

    expect(traces.topSites).toEqual([
      { site: "sitio.com", browsingTime: "1.00", users: "1" },
    ]);
    expect(traces.topUsers).toEqual([
      { username: "u1", fullName: "Ana Pérez", browsingTime: "1.00" },
    ]);
    expect(traces.topDownloads).toEqual([
      { username: "u1", fullName: "Ana Pérez", downloaded: "1.00 MB" },
    ]);
  });
});
