"use client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { activeRouteHref } from "./active";
import type { SidebarProps } from "./types";

export default function SidebarMobile({ routes }: SidebarProps) {
  const pathname = usePathname();
  const activeHref = activeRouteHref(pathname, routes);

  return (
    <nav className="flex w-full rounded-xl border p-4 md:hidden">
      <ul className="flex w-full justify-around gap-x-2">
        {routes.map((route) => {
          const isActive = route.href === activeHref;
          return (
            <li key={route.href} className="min-w-0">
              <Link
                href={route.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "hover:bg-accent/60 flex w-full flex-col items-center gap-1 rounded-t-md border-b-2 border-transparent p-2 text-center text-xs leading-tight transition-colors duration-200",
                  isActive && "border-current",
                )}
              >
                <route.icon className="size-6 shrink-0" aria-hidden="true" />
                <span className="min-w-0">{route.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
