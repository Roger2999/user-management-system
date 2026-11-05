import type { UserProfiles } from "../assembly/section-traces";
import type { RuleCategory } from "../rules/matcher";

/**
 * Incidencias de la tabla 4 del informe.
 *
 * La tabla se arma desde los hallazgos persistidos, no desde la detección del
 * momento: la persona revisa cada hallazgo en la UI, le pone disposición y
 * medida, y el documento tiene que reflejar esa revisión. Por eso la generación
 * persiste primero y vuelve a leer.
 *
 * Un falso positivo no llega al documento. Un hallazgo pendiente sí: la tabla
 * muestra la evidencia y deja la medida vacía para que se complete a mano.
 */

export type IncidentCategory = Extract<
  RuleCategory,
  "ADULT" | "SUBVERSIVE" | "ANON_PROXY" | "MINING" | "MALWARE"
>;

export const INCIDENT_CATEGORIES: readonly IncidentCategory[] = [
  "ADULT",
  "SUBVERSIVE",
  "ANON_PROXY",
  "MINING",
  "MALWARE",
] as const;

/** Etiqueta legible de la columna `Categoría`. */
export const INCIDENT_LABELS: Record<IncidentCategory, string> = {
  ADULT: "Contenido para adultos",
  SUBVERSIVE: "C/R o subversivo",
  ANON_PROXY: "Proxy anónimo",
  MINING: "Minería de criptomonedas",
  MALWARE: "Malware",
};

/**
 * Prefijo del párrafo de cada pregunta `Si ____ / No ____` del documento.
 *
 * Se usa el prefijo y no el texto completo porque la pregunta continúa con la
 * aclaración entre paréntesis. Las subpreguntas de "Reporte de Incidencia al
 * GST. UNE" no empiezan con estos prefijos y quedan manuales.
 */
export const INCIDENT_QUESTIONS: readonly {
  category: IncidentCategory;
  prefix: string;
}[] = [
  {
    category: "ADULT",
    prefix: "Visitas a sitios de contenido pornográfico",
  },
  {
    category: "SUBVERSIVE",
    prefix: "Visitas a sitios C/R o subversivos",
  },
  {
    category: "ANON_PROXY",
    prefix: "Uso no autorizado de Proxys Anónimos",
  },
  {
    category: "MINING",
    prefix: "Visitas a sitios de minería de criptomonedas",
  },
  {
    category: "MALWARE",
    prefix: "Visitas a sitios de malware",
  },
];

export function isIncidentCategory(value: string): value is IncidentCategory {
  return (INCIDENT_CATEGORIES as readonly string[]).includes(value);
}

/** Hallazgo tal como lo devuelve la persistencia. */
export type IncidentSource = {
  url: string;
  category: IncidentCategory;
  username: string | null;
  disposition: "PENDING" | "CONFIRMED" | "FALSE_POSITIVE" | "ACTION_TAKEN";
  measure: string | null;
  /** Completa el nombre cuando `AccountRequest` no lo tiene. */
  proxyFullName?: string;
  proxyPosition?: string;
};

export type IncidentRow = {
  url: string;
  category: IncidentCategory;
  label: string;
  username: string;
  fullName: string;
  position: string;
  measure: string;
};

function orderOf(category: IncidentCategory): number {
  return INCIDENT_CATEGORIES.indexOf(category);
}

function oneLine(value: string | null): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

export function buildIncidents(
  sources: readonly IncidentSource[],
  profiles: UserProfiles = {},
): IncidentRow[] {
  const byUser = new Map(
    Object.entries(profiles).map(([username, profile]) => [
      username.toLowerCase(),
      profile,
    ]),
  );

  return sources
    .filter((source) => source.disposition !== "FALSE_POSITIVE")
    .map((source) => {
      const profile =
        source.username === null
          ? undefined
          : byUser.get(source.username.toLowerCase());

      return {
        url: source.url,
        category: source.category,
        label: INCIDENT_LABELS[source.category],
        username: source.username ?? "",
        fullName: profile?.fullName ?? source.proxyFullName ?? "",
        position: profile?.position ?? source.proxyPosition ?? "",
        measure: oneLine(source.measure),
      };
    })
    .sort(
      (a, b) =>
        orderOf(a.category) - orderOf(b.category) ||
        a.url.localeCompare(b.url) ||
        a.username.localeCompare(b.username),
    );
}
