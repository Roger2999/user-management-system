"use client";

import { Button } from "@/components/ui/button";
import { revokeSessionAction } from "../actions/revoke-session-action";
import type { Session } from "better-auth";

type Props = {
  sessions: Session[];
  currentSessionId: string;
};

function parseUserAgent(userAgent?: string | null) {
  if (!userAgent) return "Dispositivo desconocido";
  const isMobile = /Mobile/.test(userAgent);
  const device = isMobile ? "Móvil" : "Escritorio";
  let browser = "Navegador";
  if (/Chrome/i.test(userAgent) && !/Edg/i.test(userAgent)) browser = "Chrome";
  else if (/Firefox/i.test(userAgent)) browser = "Firefox";
  else if (/Safari/i.test(userAgent)) browser = "Safari";
  else if (/Edg/i.test(userAgent)) browser = "Edge";
  return `${browser} · ${device}`;
}

export default function SessionsList({ sessions, currentSessionId }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Sesiones activas</h2>
      <div className="space-y-2 rounded-xl border p-6">
        {sessions.length === 0 && (
          <p className="text-muted-foreground">No hay sesiones activas</p>
        )}
        {sessions.map((session) => {
          const isCurrent = session.id === currentSessionId;
          return (
            <div
              className="flex items-center justify-between gap-4 border-b py-2 last:border-b-0"
              key={session.id}
            >
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  {isCurrent && (
                    <span className="text-brand rounded border px-1.5 py-0.5 text-xs font-medium">
                      Sesión actual
                    </span>
                  )}
                  <p className="truncate text-sm font-medium">
                    {parseUserAgent(session.userAgent)}
                  </p>
                </div>
                <p className="text-muted-foreground truncate text-xs">
                  {session.ipAddress ?? "IP desconocida"} · Expira el{" "}
                  {new Date(session.expiresAt).toLocaleDateString("es-AR")}
                </p>
              </div>
              {!isCurrent && (
                <form action={revokeSessionAction}>
                  <input type="hidden" name="token" value={session.token} />
                  <Button variant="destructive" size="sm">
                    Revocar
                  </Button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
