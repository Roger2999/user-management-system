import { Client, type Entry } from "ldapts";

import type { AdSyncConfig } from "./config";
import { mapAdUserEntry, type AdEntry } from "./mapper";
import type { SearchAdUsers } from "./sync";
import type { AdDomainUser } from "./types";

/**
 * Búsqueda real del dominio (S1): bind de la cuenta de servicio, búsqueda
 * paginada sobre la OU de usuarios y traducción a perfiles con el mapper puro.
 *
 * El filtro `(&(objectCategory=person)(objectClass=user))` es el que excluye a
 * las cuentas de máquina y de servicio de la carga de dominio completo (S3).
 * `attributes` fija sólo lo que el mapper usa, para que la corrida no baje el
 * árbol completo de atributos de miles de usuarios por cada sync.
 */

const DEFAULT_FILTER =
  "(&(objectCategory=person)(objectClass=user))";

const SEARCH_ATTRIBUTES = [
  "sAMAccountName",
  "displayName",
  "givenName",
  "sn",
  "title",
  "department",
  "userAccountControl",
];

const PAGE_SIZE = 500;

function clientOptions(config: AdSyncConfig) {
  return {
    url: config.url,
    connectTimeout: 10_000,
    timeout: 30_000,
    tlsOptions:
      config.tlsInsecure === true ? { rejectUnauthorized: false } : {},
  };
}

/**
 * Recorre el dominio y entrega un perfil por usuario navegable.
 *
 * En `async function*` para mantener conectado el cliente mientras el upsert
 * consume la secuencia y para no cargar el dominio entero en memoria.
 */
export const searchAdUsers: SearchAdUsers = async function*
searchAdUsers(config: AdSyncConfig): AsyncIterable<AdDomainUser> {
  const client = new Client(clientOptions(config));

  try {
    await client.bind(config.bindDn, config.bindPassword);

    for await (const page of client.searchPaginated(config.searchBase, {
      scope: "sub",
      filter: DEFAULT_FILTER,
      attributes: SEARCH_ATTRIBUTES,
      paged: { pageSize: PAGE_SIZE },
    })) {
      for (const entry of page.searchEntries as Entry[]) {
        const user = mapAdUserEntry(entry as AdEntry);
        if (user !== null) yield user;
      }
    }
  } finally {
    await client.unbind().catch(() => {
      // El cierre del socket no invalida la corrida: los datos ya viajaron.
    });
  }
};
