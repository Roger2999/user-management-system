export const publicRoutes: {
  name: string;
  href: string;
  id: string;
}[] = [];
export const privateRoutes: {
  name: string;
  href: string;
  id: string;
}[] = [{ name: "Settings", href: "/dashboard/settings", id: "1" }];
export const themes = [
  { name: "light", label: "Claro" },
  { name: "dark", label: "Oscuro" },
  { name: "system", label: "Sistema" },
];
export const REQUEST_OPTIONS = [
  { value: "ALTA", label: "Alta" },
  { value: "ACTUALIZACION", label: "Actualización" },
] as const;

export const PERSONAL_OPTIONS = [
  { value: "DIRECTIVO", label: "Directivo" },
  { value: "ESPECIALISTA_PRINCIPAL", label: "Especialista Principal" },
  { value: "TECNICO", label: "Técnico" },
  { value: "OTRO", label: "Otro" },
] as const;

export const ACCOUNT_OPTIONS = [
  { value: "PERMANENTE", label: "Permanente" },
  { value: "TEMPORAL", label: "Temporal" },
] as const;
