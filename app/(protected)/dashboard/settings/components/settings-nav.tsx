"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Props = {
  isAdmin: boolean;
};

const SECTIONS = [
  { href: "/dashboard/settings/account", label: "Mi cuenta" },
  {
    href: "/dashboard/settings/administration",
    label: "Administración",
    adminOnly: true,
  },
] as const;

export default function SettingsNav({ isAdmin }: Props) {
  const pathname = usePathname();
  const sections = SECTIONS.filter(
    (section) => !("adminOnly" in section) || isAdmin,
  );

  // Un solo destino no necesita selector.
  if (sections.length < 2) return null;

  return (
    <nav aria-label="Secciones de configuración" className="w-full">
      <ul className="flex gap-1 border-b">
        {sections.map((section) => {
          const isActive = pathname === section.href;
          return (
            <li key={section.href}>
              <Link
                href={section.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "-mb-px inline-block border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "border-brand text-foreground"
                    : "text-muted-foreground hover:text-foreground border-transparent",
                )}
              >
                {section.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
