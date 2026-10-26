import type { RuleCategory, RuleMatchType } from "./matcher";

/**
 * Patrones de prueba para las categorías prohibidas del informe (S5).
 *
 * Esto es un punto de partida para probar el motor, no una lista oficial. El
 * especialista es quien define qué entra en cada categoría para su entidad; el
 * seed solo agrega y reactiva, nunca borra reglas propias.
 *
 * `SUBVERSIVE` queda deliberadamente sin patrones. Inventar una lista de sitios
 * políticos no es una decisión técnica y una lista inventada produce hallazgos
 * falsos con nombre y apellidos en un informe oficial. El motor ya soporta la
 * categoría: la lista real la carga el especialista.
 *
 * Todos los patrones son `SUFFIX`: `pornhub.com` cubre `pornhub.com` y
 * `www.pornhub.com` sin repetir cada subdominio. Se comparan contra el hostname
 * persistido, en minúsculas.
 */

export type DefaultCategoryRule = {
  category: RuleCategory;
  matchType: RuleMatchType;
  pattern: string;
};

export const DEFAULT_CATEGORY_RULES: readonly DefaultCategoryRule[] = [
  // Contenido para adultos.
  { category: "ADULT", matchType: "SUFFIX", pattern: "pornhub.com" },
  { category: "ADULT", matchType: "SUFFIX", pattern: "xvideos.com" },
  { category: "ADULT", matchType: "SUFFIX", pattern: "xnxx.com" },
  { category: "ADULT", matchType: "SUFFIX", pattern: "xhamster.com" },
  { category: "ADULT", matchType: "SUFFIX", pattern: "redtube.com" },
  { category: "ADULT", matchType: "SUFFIX", pattern: "youporn.com" },
  { category: "ADULT", matchType: "SUFFIX", pattern: "spankbang.com" },
  { category: "ADULT", matchType: "SUFFIX", pattern: "eporner.com" },
  { category: "ADULT", matchType: "SUFFIX", pattern: "beeg.com" },
  { category: "ADULT", matchType: "SUFFIX", pattern: "txxx.com" },
  { category: "ADULT", matchType: "SUFFIX", pattern: "brazzers.com" },
  { category: "ADULT", matchType: "SUFFIX", pattern: "onlyfans.com" },
  { category: "ADULT", matchType: "SUFFIX", pattern: "chaturbate.com" },
  { category: "ADULT", matchType: "SUFFIX", pattern: "stripchat.com" },
  { category: "ADULT", matchType: "SUFFIX", pattern: "livejasmin.com" },
  { category: "ADULT", matchType: "SUFFIX", pattern: "bongacams.com" },
  { category: "ADULT", matchType: "SUFFIX", pattern: "cam4.com" },
  { category: "ADULT", matchType: "SUFFIX", pattern: "myfreecams.com" },
  { category: "ADULT", matchType: "SUFFIX", pattern: "hclips.com" },
  { category: "ADULT", matchType: "SUFFIX", pattern: "tube8.com" },
  { category: "ADULT", matchType: "SUFFIX", pattern: "porn.com" },
  { category: "ADULT", matchType: "SUFFIX", pattern: "sex.com" },
  { category: "ADULT", matchType: "SUFFIX", pattern: "adultfriendfinder.com" },
  { category: "ADULT", matchType: "SUFFIX", pattern: "ashleymadison.com" },

  // Proxies anónimos, túneles y herramientas de circunvención.
  { category: "ANON_PROXY", matchType: "SUFFIX", pattern: "proxysite.com" },
  { category: "ANON_PROXY", matchType: "SUFFIX", pattern: "proxfree.com" },
  { category: "ANON_PROXY", matchType: "SUFFIX", pattern: "hide.me" },
  { category: "ANON_PROXY", matchType: "SUFFIX", pattern: "hidemyass.com" },
  { category: "ANON_PROXY", matchType: "SUFFIX", pattern: "kproxy.com" },
  { category: "ANON_PROXY", matchType: "SUFFIX", pattern: "croxyproxy.com" },
  { category: "ANON_PROXY", matchType: "SUFFIX", pattern: "blockaway.net" },
  { category: "ANON_PROXY", matchType: "SUFFIX", pattern: "filterbypass.me" },
  { category: "ANON_PROXY", matchType: "SUFFIX", pattern: "torproject.org" },
  { category: "ANON_PROXY", matchType: "SUFFIX", pattern: "tor2web.org" },
  { category: "ANON_PROXY", matchType: "SUFFIX", pattern: "psiphon.ca" },
  { category: "ANON_PROXY", matchType: "SUFFIX", pattern: "ultrasurf.us" },
  { category: "ANON_PROXY", matchType: "SUFFIX", pattern: "freegate.com" },
  { category: "ANON_PROXY", matchType: "SUFFIX", pattern: "lantern.io" },
  { category: "ANON_PROXY", matchType: "SUFFIX", pattern: "getlantern.org" },

  // Minería de criptomonedas, incluida la que corre en el navegador.
  { category: "MINING", matchType: "SUFFIX", pattern: "minexmr.com" },
  { category: "MINING", matchType: "SUFFIX", pattern: "nanopool.org" },
  { category: "MINING", matchType: "SUFFIX", pattern: "2miners.com" },
  { category: "MINING", matchType: "SUFFIX", pattern: "ethermine.org" },
  { category: "MINING", matchType: "SUFFIX", pattern: "flexpool.io" },
  { category: "MINING", matchType: "SUFFIX", pattern: "poolin.com" },
  { category: "MINING", matchType: "SUFFIX", pattern: "f2pool.com" },
  { category: "MINING", matchType: "SUFFIX", pattern: "antpool.com" },
  { category: "MINING", matchType: "SUFFIX", pattern: "viabtc.com" },
  { category: "MINING", matchType: "SUFFIX", pattern: "braiins.com" },
  { category: "MINING", matchType: "SUFFIX", pattern: "nicehash.com" },
  { category: "MINING", matchType: "SUFFIX", pattern: "minergate.com" },
  { category: "MINING", matchType: "SUFFIX", pattern: "supportxmr.com" },
  { category: "MINING", matchType: "SUFFIX", pattern: "moneroocean.stream" },
  { category: "MINING", matchType: "SUFFIX", pattern: "c3pool.com" },
  { category: "MINING", matchType: "SUFFIX", pattern: "hashvault.pro" },
  { category: "MINING", matchType: "SUFFIX", pattern: "woolypooly.com" },
  { category: "MINING", matchType: "SUFFIX", pattern: "herominers.com" },
  { category: "MINING", matchType: "SUFFIX", pattern: "kryptex.com" },
  { category: "MINING", matchType: "SUFFIX", pattern: "unmineable.com" },
  { category: "MINING", matchType: "SUFFIX", pattern: "coinhive.com" },
  { category: "MINING", matchType: "SUFFIX", pattern: "coinimp.com" },
  { category: "MINING", matchType: "SUFFIX", pattern: "cryptoloot.pro" },
  { category: "MINING", matchType: "SUFFIX", pattern: "webminepool.com" },
];
