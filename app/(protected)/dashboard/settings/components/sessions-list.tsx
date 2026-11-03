"use client";

import type { Session } from "better-auth";
import RevokeOtherSessionsDialog from "./revoke-other-sessions-dialog";
import RevokeSessionDialog from "./revoke-session-dialog";

type Props = {
  sessions: Session[];
  currentSessionId: string;
};

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
});

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
  const otherSessions = sessions.filter(
    (session) => session.id !== currentSessionId,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-base font-medium">Sesiones activas</h3>
          <p className="text-muted-foreground text-sm">
            {sessions.length === 1
              ? "1 dispositivo con la sesión abierta"
              : `${sessions.length} dispositivos con la sesión abierta`}
          </p>
        </div>
        {otherSessions.length > 0 && (
          <RevokeOtherSessionsDialog count={otherSessions.length} />
        )}
      </div>
      <div className="space-y-2 rounded-xl border p-6">
        {sessions.length === 0 && (
          <p className="text-muted-foreground">No hay sesiones activas</p>
        )}
        {sessions.map((session) => {
          const isCurrent = session.id === currentSessionId;
          const device = parseUserAgent(session.userAgent);
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
                  <p className="truncate text-sm font-medium">{device}</p>
                </div>
                <p className="text-muted-foreground truncate text-xs">
                  {session.ipAddress ?? "IP desconocida"} · Inició el{" "}
                  <time
                    dateTime={new Date(session.createdAt).toISOString()}
                    suppressHydrationWarning
                  >
                    {dateFormatter.format(new Date(session.createdAt))}
                  </time>
                </p>
              </div>
              {!isCurrent && (
                <RevokeSessionDialog token={session.token} device={device} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
