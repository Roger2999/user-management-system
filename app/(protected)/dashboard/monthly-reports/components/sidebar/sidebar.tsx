"use client";
import { FilePlus2, FileText } from "lucide-react";
import SidebarDesktop from "./sidebar-desktop";
import SidebarMobile from "./sidebar-mobile";
import type { SidebarRoute } from "./types";

const ROUTES: SidebarRoute[] = [
  {
    label: "Historial de informes",
    icon: FileText,
    href: "/dashboard/monthly-reports",
  },
  {
    label: "Nuevo informe",
    icon: FilePlus2,
    href: "/dashboard/monthly-reports/new",
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
