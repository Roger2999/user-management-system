import type { LucideIcon } from "lucide-react";

export type SidebarRoute = {
  label: string;
  icon: LucideIcon;
  href: string;
};

export type SidebarProps = {
  routes: SidebarRoute[];
};
