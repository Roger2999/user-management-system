"use client";
import { FilePlus2, FileText, Home } from "lucide-react";
import SidebarDesktop from "./sidebar-desktop";
import SidebarMobile from "./sidebar-mobile";
import type { SidebarRoute } from "./types";

const ROUTES: SidebarRoute[] = [
  { label: "Inicio", icon: Home, href: "/monthly-report-management" },
  {
    label: "Nuevo informe",
    icon: FilePlus2,
    href: "/monthly-report-management/new",
  },
  {
    label: "Resumen",
    icon: FileText,
    href: "/monthly-report-management/summary",
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
