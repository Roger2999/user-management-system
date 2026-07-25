"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Fragment } from "react";
import { Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  settings: "Configuracion",
  "user-accounts-management": "Gestion de cuentas",
  users: "Usuarios",
  create: "Crear solicitud",
  edit: "Editar solicitud",
  sign: "Firmar solicitud",
};

function isDynamicSegment(segment: string): boolean {
  return /^[a-z0-9]+$/i.test(segment) && segment.length > 20;
}

function formatSegment(segment: string): string {
  if (isDynamicSegment(segment)) return "Detalle";
  return SEGMENT_LABELS[segment] ?? segment;
}

export default function Breadcrumbs() {
  const pathname = usePathname();

  if (pathname === "/dashboard") return null;

  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href?: string }[] = [];

  segments.forEach((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const isLast = index === segments.length - 1;

    crumbs.push({
      label: formatSegment(segment),
      href: isLast ? undefined : href,
    });
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/dashboard">
              <Home className="size-4" />
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        {crumbs.map((crumb, index) => (
          <Fragment key={index}>
            <BreadcrumbItem>
              {crumb.href ? (
                <BreadcrumbLink asChild>
                  <Link href={crumb.href}>{crumb.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {index < crumbs.length - 1 && <BreadcrumbSeparator />}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
