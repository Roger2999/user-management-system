"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface ExpiringAccount {
  id: string;
  nombreApellidos: string;
  fechaExpiracion: string;
}

interface Props {
  count7: number;
  count1: number;
  accounts: ExpiringAccount[];
}

function daysLeft(fechaExpiracion: string): number {
  const diff = new Date(fechaExpiracion).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function NotificationBell({ count7, count1, accounts }: Props) {
  const total = count7;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="hover:bg-accent relative inline-flex size-10 items-center justify-center rounded-md transition-colors"
          aria-label="Notificaciones de expiración"
        >
          <Bell className="text-brand size-6" />
          {total > 0 && (
            <span
              className={cn(
                "absolute -top-1 -right-0.5 flex min-h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-semibold",
                count1 > 0
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-amber-500 text-white",
              )}
            >
              {total}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="text-sm font-semibold">
          Cuentas por expirar
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {total === 0 ? (
          <p className="text-muted-foreground px-1.5 py-2 text-sm">
            No hay cuentas temporales por expirar.
          </p>
        ) : (
          <>
            <DropdownMenuItem asChild>
              <Link
                href={`/dashboard/user-accounts-manangment/users?filter=${encodeURIComponent("expiring7")}`}
                className="flex w-full items-center justify-between"
              >
                <span>Expiran en ≤7 días</span>
                <span className="text-muted-foreground text-xs">{count7}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href={`/dashboard/user-accounts-manangment/users?filter=${encodeURIComponent("expiring1")}`}
                className="flex w-full items-center justify-between"
              >
                <span>Expiran en ≤1 día</span>
                <span className="text-destructive text-xs font-semibold">
                  {count1}
                </span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="max-h-60 overflow-y-auto">
              {accounts.map((account) => {
                const left = daysLeft(account.fechaExpiracion);
                return (
                  <DropdownMenuItem key={account.id} asChild>
                    <Link
                      href={`/dashboard/user-accounts-manangment/users/edit/${account.id}`}
                      className="flex w-full items-center justify-between gap-2"
                    >
                      <span className="truncate">
                        {account.nombreApellidos}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 text-xs",
                          left <= 1
                            ? "text-destructive font-semibold"
                            : "text-muted-foreground",
                        )}
                      >
                        {left <= 0
                          ? "hoy"
                          : left === 1
                            ? "mañana"
                            : `${left} días`}
                      </span>
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
