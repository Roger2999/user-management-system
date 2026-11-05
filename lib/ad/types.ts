/**
 * Tipos compartidos de la sincronización con el Active Directory.
 */

/** Un usuario del dominio listo para el upsert sobre `ProxyAccount`. */
export type AdDomainUser = {
  username: string;
  fullName: string;
  position: string;
  area: string;
  active: boolean;
};

/**
 * Resultado de una corrida de sincronización, en la escala de la unidad que
 * retorna en producción.
 */
export type AdSyncResult = {
  created: number;
  updated: number;
  deactivated: number;
};
