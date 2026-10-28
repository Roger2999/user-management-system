/**
 * Números publicados por WebSpy Giga Analyzer 2.3 para mayo 2026.
 *
 * Origen: los exports `2026-06-04 Users Export(...).doc` de la herramienta,
 * contrastados fila por fila contra las tablas del documento oficial
 * `IM EE Matanzas mayo 2026.docx`: cero diferencias en hits, tiempo de
 * navegación y porcentaje.
 *
 * No se guardan los nombres de usuario. El contrato que se verifica es
 * aritmético y de orden, no de identidad: `username` se rellena en el test.
 *
 * `total.browsingMs` es la fila `Total` del export: es el denominador del
 * `% of Browsing Time`, la suma de TODOS los usuarios del sitio, y no el
 * `Browsing Time` de la tabla de sitios.
 *
 * El rango de estos exports es 30/04/2026 - 31/05/2026 (32 días). Sirven para
 * verificar formato, orden y denominador; no para comparar totales contra un
 * informe de 31 días.
 */

export type ExportUserRow = {
  hits: number;
  bytesIn: number;
  elapsedMs: number;
  browsingMs: number;
  /** Porcentaje impreso por WebSpy, tal cual. */
  percent: string;
};

export type ExportSiteExpectation = {
  site: string;
  total: {
    hits: number;
    bytesIn: number;
    elapsedMs: number;
    browsingMs: number;
  };
  users: readonly ExportUserRow[];
};

export const SPY_MAY_EXPORTS: readonly ExportSiteExpectation[] = [
  {
    site: "www.facebook.com",
    total: {
      hits: 27248,
      bytesIn: 1683079823,
      elapsedMs: 1603824000,
      browsingMs: 527631000,
    },
    users: [
      {
        hits: 1556,
        bytesIn: 310063923,
        elapsedMs: 552464000,
        browsingMs: 110074000,
        percent: "20.9%",
      },
      {
        hits: 2530,
        bytesIn: 741940920,
        elapsedMs: 363575000,
        browsingMs: 91685000,
        percent: "17.4%",
      },
      {
        hits: 967,
        bytesIn: 250441892,
        elapsedMs: 378123000,
        browsingMs: 46440000,
        percent: "8.8%",
      },
      {
        hits: 327,
        bytesIn: 138810491,
        elapsedMs: 124858000,
        browsingMs: 8185000,
        percent: "1.6%",
      },
      {
        hits: 152,
        bytesIn: 2998927,
        elapsedMs: 29425000,
        browsingMs: 7459000,
        percent: "1.4%",
      },
      {
        hits: 104,
        bytesIn: 21653094,
        elapsedMs: 24146000,
        browsingMs: 5529000,
        percent: "1.0%",
      },
      {
        hits: 123,
        bytesIn: 102519276,
        elapsedMs: 45486000,
        browsingMs: 4650000,
        percent: "0.9%",
      },
      {
        hits: 119,
        bytesIn: 4896850,
        elapsedMs: 13589000,
        browsingMs: 3999000,
        percent: "0.8%",
      },
      {
        hits: 31,
        bytesIn: 73400,
        elapsedMs: 0,
        browsingMs: 1823000,
        percent: "0.3%",
      },
      {
        hits: 24,
        bytesIn: 5609882,
        elapsedMs: 10750000,
        browsingMs: 1739000,
        percent: "0.3%",
      },
    ],
  },
  {
    site: "www.bing.com",
    total: {
      hits: 12574,
      bytesIn: 238718812,
      elapsedMs: 171514000,
      browsingMs: 134715000,
    },
    users: [
      {
        hits: 912,
        bytesIn: 60607693,
        elapsedMs: 53202000,
        browsingMs: 28475000,
        percent: "21.1%",
      },
      {
        hits: 496,
        bytesIn: 35777413,
        elapsedMs: 35686000,
        browsingMs: 14081000,
        percent: "10.5%",
      },
      {
        hits: 309,
        bytesIn: 13222543,
        elapsedMs: 15449000,
        browsingMs: 9352000,
        percent: "6.9%",
      },
      {
        hits: 301,
        bytesIn: 9646899,
        elapsedMs: 8567000,
        browsingMs: 8618000,
        percent: "6.4%",
      },
      {
        hits: 385,
        bytesIn: 964690,
        elapsedMs: 18000,
        browsingMs: 8451000,
        percent: "6.3%",
      },
      {
        hits: 128,
        bytesIn: 13558088,
        elapsedMs: 8709000,
        browsingMs: 4822000,
        percent: "3.6%",
      },
      {
        hits: 158,
        bytesIn: 15393096,
        elapsedMs: 11161000,
        browsingMs: 3689000,
        percent: "2.7%",
      },
      {
        hits: 131,
        bytesIn: 15581839,
        elapsedMs: 9193000,
        browsingMs: 3674000,
        percent: "2.7%",
      },
      {
        hits: 166,
        bytesIn: 12677284,
        elapsedMs: 7873000,
        browsingMs: 3203000,
        percent: "2.4%",
      },
      {
        hits: 160,
        bytesIn: 16022241,
        elapsedMs: 13527000,
        browsingMs: 3183000,
        percent: "2.4%",
      },
    ],
  },
  {
    site: "www.instagram.com",
    total: {
      hits: 7341,
      bytesIn: 118793175,
      elapsedMs: 408124000,
      browsingMs: 147539000,
    },
    users: [
      {
        hits: 2126,
        bytesIn: 48779756,
        elapsedMs: 359066000,
        browsingMs: 68535000,
        percent: "46.5%",
      },
      {
        hits: 299,
        bytesIn: 33460060,
        elapsedMs: 29745000,
        browsingMs: 15460000,
        percent: "10.5%",
      },
      {
        hits: 20,
        bytesIn: 5662310,
        elapsedMs: 2698000,
        browsingMs: 1770000,
        percent: "1.2%",
      },
      {
        hits: 31,
        bytesIn: 3261071,
        elapsedMs: 4524000,
        browsingMs: 960000,
        percent: "0.7%",
      },
      {
        hits: 17,
        bytesIn: 41943,
        elapsedMs: 1000,
        browsingMs: 664000,
        percent: "0.5%",
      },
      {
        hits: 15,
        bytesIn: 41943,
        elapsedMs: 16000,
        browsingMs: 595000,
        percent: "0.4%",
      },
      {
        hits: 7,
        bytesIn: 335544,
        elapsedMs: 239000,
        browsingMs: 461000,
        percent: "0.3%",
      },
      {
        hits: 30,
        bytesIn: 4016046,
        elapsedMs: 4353000,
        browsingMs: 458000,
        percent: "0.3%",
      },
      {
        hits: 6,
        bytesIn: 10486,
        elapsedMs: 0,
        browsingMs: 417000,
        percent: "0.3%",
      },
      {
        hits: 4,
        bytesIn: 10486,
        elapsedMs: 0,
        browsingMs: 277000,
        percent: "0.2%",
      },
    ],
  },
  {
    site: "www.kimi.com",
    total: {
      hits: 2731,
      bytesIn: 220840591,
      elapsedMs: 167138000,
      browsingMs: 39792000,
    },
    users: [
      {
        hits: 410,
        bytesIn: 150827172,
        elapsedMs: 95938000,
        browsingMs: 15280000,
        percent: "38.4%",
      },
      {
        hits: 217,
        bytesIn: 39153828,
        elapsedMs: 44168000,
        browsingMs: 6075000,
        percent: "15.3%",
      },
      {
        hits: 30,
        bytesIn: 5903483,
        elapsedMs: 6164000,
        browsingMs: 2031000,
        percent: "5.1%",
      },
      {
        hits: 68,
        bytesIn: 11796480,
        elapsedMs: 13320000,
        browsingMs: 1193000,
        percent: "3.0%",
      },
      {
        hits: 23,
        bytesIn: 5966397,
        elapsedMs: 4620000,
        browsingMs: 777000,
        percent: "2.0%",
      },
      {
        hits: 2,
        bytesIn: 20972,
        elapsedMs: 222000,
        browsingMs: 222000,
        percent: "0.6%",
      },
      {
        hits: 8,
        bytesIn: 734003,
        elapsedMs: 2112000,
        browsingMs: 198000,
        percent: "0.5%",
      },
      {
        hits: 1,
        bytesIn: 31457,
        elapsedMs: 228000,
        browsingMs: 0,
        percent: "0.0%",
      },
    ],
  },
  {
    site: "www.cd4o.com",
    total: {
      hits: 2369,
      bytesIn: 1384319549,
      elapsedMs: 9748000,
      browsingMs: 8875000,
    },
    users: [
      {
        hits: 70,
        bytesIn: 647285965,
        elapsedMs: 5108000,
        browsingMs: 3381000,
        percent: "38.1%",
      },
      {
        hits: 64,
        bytesIn: 727848059,
        elapsedMs: 4590000,
        browsingMs: 1063000,
        percent: "12.0%",
      },
      {
        hits: 2056,
        bytesIn: 6553600,
        elapsedMs: 11000,
        browsingMs: 380000,
        percent: "4.3%",
      },
      {
        hits: 4,
        bytesIn: 2055209,
        elapsedMs: 19000,
        browsingMs: 91000,
        percent: "1.0%",
      },
    ],
  },
  {
    site: "www.mediafire.com",
    total: {
      hits: 2065,
      bytesIn: 49692017,
      elapsedMs: 28234000,
      browsingMs: 25845000,
    },
    users: [
      {
        hits: 1061,
        bytesIn: 19608371,
        elapsedMs: 2748000,
        browsingMs: 8588000,
        percent: "33.2%",
      },
      {
        hits: 161,
        bytesIn: 22743613,
        elapsedMs: 23697000,
        browsingMs: 5337000,
        percent: "20.7%",
      },
      {
        hits: 296,
        bytesIn: 5536481,
        elapsedMs: 1778000,
        browsingMs: 4366000,
        percent: "16.9%",
      },
    ],
  },
  {
    site: "www.fbsbx.com",
    total: {
      hits: 1218,
      bytesIn: 5117051,
      elapsedMs: 15831000,
      browsingMs: 21370000,
    },
    users: [
      {
        hits: 271,
        bytesIn: 1845494,
        elapsedMs: 9807000,
        browsingMs: 9363000,
        percent: "43.8%",
      },
      {
        hits: 37,
        bytesIn: 230687,
        elapsedMs: 2281000,
        browsingMs: 870000,
        percent: "4.1%",
      },
      {
        hits: 2,
        bytesIn: 0,
        elapsedMs: 30000,
        browsingMs: 247000,
        percent: "1.2%",
      },
      {
        hits: 8,
        bytesIn: 52429,
        elapsedMs: 351000,
        browsingMs: 182000,
        percent: "0.9%",
      },
      {
        hits: 8,
        bytesIn: 10486,
        elapsedMs: 220000,
        browsingMs: 146000,
        percent: "0.7%",
      },
      {
        hits: 4,
        bytesIn: 10486,
        elapsedMs: 216000,
        browsingMs: 112000,
        percent: "0.5%",
      },
      {
        hits: 35,
        bytesIn: 115343,
        elapsedMs: 1746000,
        browsingMs: 62000,
        percent: "0.3%",
      },
      {
        hits: 11,
        bytesIn: 115343,
        elapsedMs: 1110000,
        browsingMs: 50000,
        percent: "0.2%",
      },
      {
        hits: 2,
        bytesIn: 0,
        elapsedMs: 30000,
        browsingMs: 0,
        percent: "0.0%",
      },
      {
        hits: 1,
        bytesIn: 0,
        elapsedMs: 15000,
        browsingMs: 0,
        percent: "0.0%",
      },
    ],
  },
];
