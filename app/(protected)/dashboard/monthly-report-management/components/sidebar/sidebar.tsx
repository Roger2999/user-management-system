"use client";
import { FilePlus2, FileText, Home } from "lucide-react";
import SidebarDesktop from "./sidebar-desktop";
import SidebarMobile from "./sidebar-mobile";
import type { SidebarRoute } from "./types";

const ROUTES: SidebarRoute[] = [
  { label: "Inicio", icon: Home, href: "/dashboard/monthly-report-management" },
  {
    label: "Nuevo informe",
    icon: FilePlus2,
    href: "/dashboard/monthly-report-management/new",
  },
  {
    label: "Resumen",
    icon: FileText,
    href: "/dashboard/monthly-report-management/summary",
  },
];

export default function Sidebar() {
  return (
    <>
      <SidebarDesktop routes={ROUTES} />
      <SidebarMobile routes={ROUTES} />
    </>
  );
}
