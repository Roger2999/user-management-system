/**
 * Tipos base del motor de informes de trazas.
 *
 * El motor es puro a propósito: no conoce Prisma, Next.js ni el sistema de
 * archivos. Todo lo que necesita entra por parámetro y lo que produce es
 * serializable. Eso permite testearlo con fixtures y ejecutarlo tanto desde un
 * route handler como desde un CLI por cron.
 */

/**
 * Una línea de `access.log` de Squid ya interpretada.
 *
 * Los nombres corresponden a las directivas del logformat de Squid:
 * `%ts.%03tu %6tr %>a %Ss/%03>Hs %<st %rm %ru %[un %Sh/%<a %mt`
 */
export type SquidLogRecord = {
  /** `%ts.%03tu`: instante del request en epoch UTC, en milisegundos. */
  timestampMs: number;
  /** `%tr`: tiempo que tardó el proxy en servir el request, en milisegundos. */
  elapsedMs: number;
  /** `%>a`: IP del cliente. */
  clientIp: string;
  /** `%Ss`: estado de Squid (`TCP_MISS`, `TCP_HIT`, `TCP_DENIED`, ...). */
  squidStatus: string;
  /** `%>Hs`: código HTTP devuelto al cliente, o null si no aplica. */
  httpStatus: number | null;
  /** `%<st`: bytes de la respuesta. */
  bytes: number;
  /** `%rm`: método HTTP. */
  method: string;
  /** `%ru`: URL solicitada. Para `CONNECT` es `host:puerto`. */
  url: string;
  /**
   * `%[un`: usuario autenticado contra el AD, o null cuando el request no se
   * autenticó (`-` en el log).
   */
  username: string | null;
  /** `%Sh`: estado de jerarquía (`DIRECT`, `PARENT_HIT`, ...). */
  hierarchy: string;
  /** `%mt`: tipo MIME. Cadena vacía cuando el log trae `-`. */
  contentType: string;
};

/** Resultado de recorrer un archivo de log. */
export type ParseStats = {
  /** Líneas leídas, incluidas las inválidas. No cuenta las líneas en blanco. */
  linesTotal: number;
  /** Líneas que no se pudieron interpretar y se descartaron. */
  linesInvalid: number;
  /**
   * Líneas aceptadas por la variante CONNECT sin estado ni tamaño. Se cuentan
   * aparte porque esos túneles no aportan bytes al volumen del informe.
   */
  linesLegacyConnect: number;
};
