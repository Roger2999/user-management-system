import type { AdDomainUser } from "./types";

/**
 * Traducción de una entrada LDAP del dominio al perfil de `ProxyAccount` (S3).
 *
 * Función pura para probar el mapeo sin conectar a un DC. `Entry` de ldapts es
 * un objeto de atributo/valores; se declara como registro para que uno mismo
 * no pida el árbol de clases del cliente en cada prueba.
 */

/** El bit 0x2 de `userAccountControl` marca la cuenta deshabilitada en AD. */
const DISABLED_FLAG = 0x2;

export type AdEntry = Record<string, Buffer | Buffer[] | string[] | string>;

function firstString(entry: AdEntry, attribute: string): string {
  const value = entry[attribute];
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value) && typeof value[0] === "string") {
    return (value[0] as string).trim();
  }
  return "";
}

export function mapAdUserEntry(entry: AdEntry): AdDomainUser | null {
  const username = firstString(entry, "sAMAccountName");
  if (username.length === 0) return null;

  const displayName = firstString(entry, "displayName");
  const givenName = firstString(entry, "givenName");
  const sn = firstString(entry, "sn");
  const fullName =
    displayName.length > 0
      ? displayName
      : [givenName, sn].filter((part) => part.length > 0).join(" ");

  const control = firstString(entry, "userAccountControl");
  const parsed = Number.parseInt(control, 10);
  const disabled = Number.isInteger(parsed) && (parsed & DISABLED_FLAG) !== 0;

  return {
    username,
    fullName,
    position: firstString(entry, "title"),
    area: firstString(entry, "department"),
    active: !disabled,
  };
}
