/**
 * Configuración de la sincronización de `ProxyAccount` desde el Active
 * Directory (spec S2).
 *
 * Todo llega por variables de entorno, como las credenciales de correo. Sin
 * las cuatro variables la sincronización queda **no configurada** (la UI lo
 * muestra y no lanza error al abrir la pantalla); con cualquiera mal escrita
 * se lanza un error explícito, porque una configuración a medias no es una
 * desconfiguración sino una equivocación.
 */

export type AdSyncConfig = {
  url: string;
  bindDn: string;
  bindPassword: string;
  searchBase: string;
  /** `true` solo con `AD_TLS_INSECURE=true`: escape documentado para el certificado autofirmado del DC. */
  tlsInsecure: boolean;
};

type Env = Record<string, string | undefined>;

const REQUIRED_VARIABLES = [
  "AD_URL",
  "AD_BIND_DN",
  "AD_BIND_PASSWORD",
  "AD_USER_SEARCH_BASE",
] as const;

function readRequired(env: Env): Record<(typeof REQUIRED_VARIABLES)[number], string> | null {
  const values: Record<string, string> = {};

  for (const variable of REQUIRED_VARIABLES) {
    const value = env[variable]?.trim();
    if (value === undefined || value.length === 0) return null;
    values[variable] = value;
  }

  return values as Record<(typeof REQUIRED_VARIABLES)[number], string>;
}

/**
 * Carga la configuración del sync o `null` si el AD no está configurado.
 *
 * Lanza `Error` con un mensaje accionable cuando la URL no es LDAPS: el
 * populate del directorio cruza la red con credenciales de dominio, y
 * conectarse sin TLS sería una fuga no un shortcut.
 */
export function loadAdConfig(env: Env = process.env): AdSyncConfig | null {
  const values = readRequired(env);
  if (values === null) return null;

  const url = values.AD_URL;

  if (!url.startsWith("ldaps://")) {
    throw new Error(
      `AD_URL debe ser ldaps://host:636 (conexión TLS obligatoria), pero recibió: ${url}`,
    );
  }

  return {
    url,
    bindDn: values.AD_BIND_DN,
    bindPassword: values.AD_BIND_PASSWORD,
    searchBase: values.AD_USER_SEARCH_BASE,
    tlsInsecure: env.AD_TLS_INSECURE?.trim() === "true",
  };
}
