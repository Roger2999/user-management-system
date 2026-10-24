import { describe, expect, it } from "vitest";
import {
  buildSiteTableRows,
  buildSiteUserTableRows,
  buildTopUsersTableRows,
  buildTracesSection,
  proposeSiteSelection,
  SITE_TABLE_HEADERS,
  SITE_USER_TABLE_HEADERS,
  type SiteTotals,
  type SiteUserTotals,
} from "./section-traces";

/** Convierte `h:m:s` del documento a milisegundos, sin perder segundos. */
function hms(value: string): number {
  const [hours, minutes, seconds] = value.split(":").map(Number);
  return (hours * 3600 + minutes * 60 + seconds) * 1000;
}

/** Convierte los MB impresos en el documento a bytes. */
function mb(value: number): number {
  return Math.round(value * 1024 * 1024);
}

function site(overrides: Partial<SiteTotals> & { site: string }): SiteTotals {
  return {
    hits: 0,
    bytesIn: 0,
    bytesOut: 0,
    elapsedMs: 0,
    browsingMs: 0,
    ...overrides,
  };
}

function siteUser(
  username: string | null,
  siteName: string,
  hits: number,
  megabytes: number,
  download: string,
  browsing: string,
): SiteUserTotals {
  return {
    site: siteName,
    username,
    hits,
    bytesIn: mb(megabytes),
    elapsedMs: hms(download),
    browsingMs: hms(browsing),
  };
}

describe("cabeceras del documento", () => {
  it("reproduce la cabecera del drill-down tal como está, con su error de unidad", () => {
    expect(SITE_USER_TABLE_HEADERS[5]).toBe("% of Browsing Time (h:m:s)");
  });

  it("usa una sola cabecera para los diez drill-downs", () => {
    // Decisión del usuario: los diez drill-downs se normalizan a Browsing Time.
    // No existe variante por hits, aunque el documento vigente la tenga en dos
    // tablas (clarity.ms y windy.com).
    expect([...SITE_USER_TABLE_HEADERS]).toEqual([
      "Users",
      "Hits",
      "Incoming (MB)",
      "Download Time (h:m:s)",
      "Browsing Time (h:m:s)",
      "% of Browsing Time (h:m:s)",
    ]);
  });

  it("emite exactamente seis columnas, en ese orden", () => {
    const [row] = buildSiteUserTableRows([
      {
        site: "www.youtube.com",
        username: "u1",
        hits: 1,
        bytesIn: 0,
        elapsedMs: 0,
        browsingMs: 0,
      },
    ]);

    expect(Object.keys(row)).toEqual([
      "username",
      "hits",
      "incoming",
      "downloadTime",
      "browsingTime",
      "percentOfBrowsingTime",
    ]);
  });

  it("declara las siete columnas de la tabla de sitios", () => {
    expect([...SITE_TABLE_HEADERS]).toEqual([
      "Sites",
      "Hits",
      "Incoming (MB)",
      "Outgoing (MB)",
      "Download Time (h:m:s)",
      "Browsing Time (h:m:s)",
      "% of Hits",
    ]);
  });
});

describe("buildSiteTableRows", () => {
  it("reproduce la fila de youtube del informe de mayo", () => {
    const rows = buildSiteTableRows(
      [
        site({
          site: "www.youtube.com",
          hits: 129351,
          bytesIn: mb(3676.86),
          elapsedMs: hms("699:52:18"),
          browsingMs: hms("266:34:32"),
        }),
      ],
      91_300_000,
    );

    expect(rows[0]).toEqual({
      site: "www.youtube.com",
      hits: "129,351",
      incoming: "3,676.86",
      outgoing: "0.00",
      downloadTime: "699:52:18",
      browsingTime: "266:34:32",
      percentOfHits: "0.1%",
    });
  });

  it("ordena por hits descendente y corta en el top", () => {
    const rows = buildSiteTableRows(
      [
        site({ site: "b.com", hits: 10 }),
        site({ site: "a.com", hits: 30 }),
        site({ site: "c.com", hits: 20 }),
      ],
      100,
      2,
    );

    expect(rows.map((row) => row.site)).toEqual(["a.com", "c.com"]);
  });
});

describe("buildSiteUserTableRows con el drill-down real de facebook", () => {
  const facebook = "www.facebook.com";
  const rows: SiteUserTotals[] = [
    siteUser("marketing", facebook, 1556, 295.7, "153:27:44", "30:34:34"),
    siteUser("yosmel", facebook, 2530, 707.57, "100:59:35", "25:28:05"),
    siteUser("dtor.var", facebook, 967, 238.84, "105:02:03", "12:54:00"),
    siteUser("aperez", facebook, 327, 132.38, "34:40:58", "02:16:25"),
    siteUser("moises", facebook, 152, 2.86, "08:10:25", "02:04:19"),
    siteUser("inversiones16", facebook, 104, 20.65, "06:42:26", "01:32:09"),
    siteUser("brian", facebook, 123, 97.77, "12:38:06", "01:17:30"),
    siteUser("amaury", facebook, 119, 4.67, "03:46:29", "01:06:39"),
    siteUser("facturacion1", facebook, 31, 0.07, "00:00:00", "00:30:23"),
    siteUser("supervisor1", facebook, 24, 5.35, "02:59:10", "00:28:59"),
  ];

  it("ordena por Browsing Time, no por hits", () => {
    // yosmel tiene más hits que marketing, pero marketing navegó más tiempo.
    const built = buildSiteUserTableRows(rows, { basisMs: hms("146:16:38") });

    expect(built.map((row) => row.username)).toEqual([
      "marketing",
      "yosmel",
      "dtor.var",
      "aperez",
      "moises",
      "inversiones16",
      "brian",
      "amaury",
      "facturacion1",
      "supervisor1",
    ]);
  });

  it("reproduce las diez filas del documento con sus porcentajes", () => {
    const built = buildSiteUserTableRows(rows, { basisMs: hms("146:16:38") });

    expect(built).toEqual([
      { username: "marketing", hits: "1,556", incoming: "295.70", downloadTime: "153:27:44", browsingTime: "30:34:34", percentOfBrowsingTime: "20.9%" },
      { username: "yosmel", hits: "2,530", incoming: "707.57", downloadTime: "100:59:35", browsingTime: "25:28:05", percentOfBrowsingTime: "17.4%" },
      { username: "dtor.var", hits: "967", incoming: "238.84", downloadTime: "105:02:03", browsingTime: "12:54:00", percentOfBrowsingTime: "8.8%" },
      { username: "aperez", hits: "327", incoming: "132.38", downloadTime: "34:40:58", browsingTime: "02:16:25", percentOfBrowsingTime: "1.6%" },
      { username: "moises", hits: "152", incoming: "2.86", downloadTime: "08:10:25", browsingTime: "02:04:19", percentOfBrowsingTime: "1.4%" },
      { username: "inversiones16", hits: "104", incoming: "20.65", downloadTime: "06:42:26", browsingTime: "01:32:09", percentOfBrowsingTime: "1.0%" },
      { username: "brian", hits: "123", incoming: "97.77", downloadTime: "12:38:06", browsingTime: "01:17:30", percentOfBrowsingTime: "0.9%" },
      { username: "amaury", hits: "119", incoming: "4.67", downloadTime: "03:46:29", browsingTime: "01:06:39", percentOfBrowsingTime: "0.8%" },
      { username: "facturacion1", hits: "31", incoming: "0.07", downloadTime: "00:00:00", browsingTime: "00:30:23", percentOfBrowsingTime: "0.3%" },
      { username: "supervisor1", hits: "24", incoming: "5.35", downloadTime: "02:59:10", browsingTime: "00:28:59", percentOfBrowsingTime: "0.3%" },
    ]);
  });

  it("excluye las cuentas sin identificar del drill-down y del denominador", () => {
    const withAnonymous = [
      ...rows,
      siteUser(null, facebook, 500, 900, "10:00:00", "05:00:00"),
    ];

    const built = buildSiteUserTableRows(withAnonymous, {
      basisMs: hms("146:16:38"),
    });

    expect(built).toHaveLength(10);
    expect(built[0].percentOfBrowsingTime).toBe("20.9%");
  });
});

describe("buildTopUsersTableRows", () => {
  it("ordena por Browsing Time aunque el título diga descargas", () => {
    const rows = buildTopUsersTableRows(
      [
        {
          username: "amaury",
          hits: 594867,
          bytesIn: mb(604006.72),
          bytesOut: mb(1.86),
          elapsedMs: hms("8501:16:08"),
          browsingMs: hms("418:44:36"),
        },
        {
          username: "red.social2",
          hits: 250426,
          bytesIn: mb(47321.1),
          bytesOut: mb(0.41),
          elapsedMs: hms("4764:37:05"),
          browsingMs: hms("726:14:18"),
        },
      ],
      47_535_600_000,
    );

    expect(rows.map((row) => row.username)).toEqual(["red.social2", "amaury"]);
    expect(rows[0]).toEqual({
      username: "red.social2",
      hits: "250,426",
      incoming: "47,321.10",
      outgoing: "0.41",
      downloadTime: "4764:37:05",
      browsingTime: "726:14:18",
      percentOfBrowsingTime: "5.5%",
    });
    expect(rows[1].percentOfBrowsingTime).toBe("3.2%");
  });
});

describe("buildTracesSection", () => {
  it("separa nacional de internacional según la selección declarada", () => {
    const section = buildTracesSection({
      totalHits: 91_300_000,
      totalBrowsingMs: 47_535_600_000,
      sites: [
        site({ site: "www.youtube.com", hits: 129351 }),
        site({ site: "www.picta.cu", hits: 639073 }),
        site({ site: "elecmtz.une.cu", hits: 900 }),
      ],
      siteUsers: [],
      users: [],
      selection: {
        international: ["www.youtube.com"],
        national: ["www.picta.cu"],
        drilldowns: [],
      },
      nationalExclusions: ["une.cu"],
    });

    expect(section.nationalSites.map((row) => row.site)).toEqual([
      "www.picta.cu",
    ]);
    expect(section.internationalSites.map((row) => row.site)).toEqual([
      "www.youtube.com",
    ]);
  });

  it("no corta la selección por hits: entra el sitio elegido y no el que más tiene", () => {
    // Caso real de mayo: `google.com` tiene 90,921 hits y no está en el
    // documento; `kimi.com` entra con 2,731. Con un top por hits sería al revés.
    const section = buildTracesSection({
      totalHits: 91_300_000,
      totalBrowsingMs: 47_535_600_000,
      sites: [
        site({ site: "google.com", hits: 90_921 }),
        site({ site: "www.kimi.com", hits: 2_731 }),
      ],
      siteUsers: [],
      users: [],
      selection: {
        international: ["www.kimi.com"],
        national: [],
        drilldowns: [],
      },
    });

    expect(section.internationalSites.map((row) => row.site)).toEqual([
      "www.kimi.com",
    ]);
  });

  it("genera un drill-down por cada sitio declarado, en el orden declarado", () => {
    const section = buildTracesSection({
      totalHits: 1000,
      totalBrowsingMs: 10_000_000,
      sites: [
        site({ site: "www.youtube.com", hits: 900 }),
        site({ site: "www.facebook.com", hits: 100 }),
      ],
      siteUsers: [
        siteUser("u1", "www.youtube.com", 900, 10, "01:00:00", "02:00:00"),
        siteUser("u2", "www.facebook.com", 100, 5, "00:30:00", "00:10:00"),
      ],
      users: [],
      selection: {
        international: ["www.youtube.com", "www.facebook.com"],
        national: [],
        drilldowns: ["www.facebook.com", "www.youtube.com"],
      },
    });

    expect(section.siteDrilldowns.map((drilldown) => drilldown.site)).toEqual([
      "www.facebook.com",
      "www.youtube.com",
    ]);
    expect(section.siteDrilldowns[1].rows.map((row) => row.username)).toEqual([
      "u1",
    ]);
  });

  it("falla si un sitio seleccionado no tiene tráfico", () => {
    expect(() =>
      buildTracesSection({
        totalHits: 10,
        totalBrowsingMs: 1000,
        sites: [site({ site: "www.youtube.com", hits: 10 })],
        siteUsers: [],
        users: [],
        selection: {
          international: ["www.youtube.com", "www.inexistente.com"],
          national: [],
          drilldowns: [],
        },
      }),
    ).toThrow(/sin tráfico/);
  });

  it("falla si un sitio nacional se declara en la tabla internacional", () => {
    expect(() =>
      buildTracesSection({
        totalHits: 10,
        totalBrowsingMs: 1000,
        sites: [site({ site: "www.picta.cu", hits: 10 })],
        siteUsers: [],
        users: [],
        selection: {
          international: ["www.picta.cu"],
          national: [],
          drilldowns: [],
        },
      }),
    ).toThrow(/clasificación international/);
  });
});

describe("proposeSiteSelection", () => {
  it("propone el top por hits de cada clasificación", () => {
    const proposal = proposeSiteSelection(
      [
        site({ site: "www.youtube.com", hits: 900 }),
        site({ site: "google.com", hits: 5000 }),
        site({ site: "www.picta.cu", hits: 7000 }),
        site({ site: "www.cubadebate.cu", hits: 100 }),
      ],
      { limit: 1 },
    );

    expect(proposal).toEqual({
      international: ["google.com"],
      national: ["www.picta.cu"],
      drilldowns: ["google.com"],
    });
  });

  it("respeta las exclusiones al clasificar la propuesta", () => {
    const proposal = proposeSiteSelection(
      [
        site({ site: "elecmtz.une.cu", hits: 9000 }),
        site({ site: "www.youtube.com", hits: 900 }),
      ],
      { nationalExclusions: ["une.cu"] },
    );

    expect(proposal.international).toEqual(["elecmtz.une.cu", "www.youtube.com"]);
    expect(proposal.national).toEqual([]);
  });
});
