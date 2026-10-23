"use client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SidebarProps } from "./types";

export default function SidebarDesktop({ routes }: SidebarProps) {
  const pathname = usePathname();
  return (
    <nav className="hidden min-h-full shrink-0 rounded-xl border p-4 sm:flex md:w-60">
      <ul className="flex w-full flex-col gap-6">
        {routes.map((route) => {
          const isActive = pathname === route.href;
          return (
            <li key={route.href}>
              <Link
                href={route.href}
                title={route.label}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "hover:bg-accent/60 flex items-center gap-x-2 rounded-t-md border-b-2 border-transparent p-2 text-sm transition-colors",
                  isActive && "border-current",
                )}
              >
                <route.icon className="size-5 shrink-0" aria-hidden="true" />
                <span className="sr-only md:not-sr-only">{route.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
