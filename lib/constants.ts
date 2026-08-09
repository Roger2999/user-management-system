import { LucideIcon, Settings, UsersIcon } from "lucide-react";

export const PUBLIC_ROUTES: {
  name: string;
  href: string;
  id: string;
  Icon?: LucideIcon;
}[] = [];
export const PRIVATE_ROUTES: {
  name: string;
  href: string;
  id: string;
  Icon: LucideIcon;
}[] = [
  {
    name: "Configuración",
    href: "/dashboard/settings",
    id: "1",
    Icon: Settings,
  },
];
export const THEMES = [
  { name: "light", label: "Claro" },
  { name: "dark", label: "Oscuro" },
  { name: "system", label: "Sistema" },
];

export const REQUEST_OPTIONS = [
  { value: "ALTA", label: "Alta" },
  { value: "ACTUALIZACION", label: "Actualización" },
  { value: "BAJA", label: "Baja" },
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
export const DASHBOARD_CARDS: {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}[] = [
  {
    title: "Gestionar cuentas de usuario",
    description: "Registra, firma, actualiza y da de baja cuentas de usuario",
    href: "/dashboard/user-accounts-management/",
    icon: UsersIcon,
  },
];
