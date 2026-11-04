"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { SyncAdDirectoryState } from "@/lib/types";
import { syncAdDirectoryAction } from "../actions/sync-ad-directory-action";

type AdDirectorySyncCardProps = {
  /** `false` cuando falta configuración en el entorno del servidor. */
  adConfigured: boolean;
};

export default function AdDirectorySyncCard({
  adConfigured,
}: AdDirectorySyncCardProps) {
  const initialState: SyncAdDirectoryState = { status: "idle" };
  const [state, action, pending] = useActionState(syncAdDirectoryAction, initialState);

  return (
    <div className="space-y-3 rounded-xl border p-6">
      <div>
        <h2 className="text-xl font-semibold">Directorio de cuentas</h2>
        <p className="text-sm text-muted-foreground">
          Llena los datos de las cuentas de proxy (nombre, cargo y área) con los
          usuarios del dominio. El informe mensual usa esos datos para escribir
          el nombre de quien navega.
        </p>
      </div>
      <form action={action}>
        <Button type="submit" disabled={pending || !adConfigured}>
          {pending ? "Sincronizando…" : "Sincronizar desde AD"}
        </Button>
      </form>
      {!adConfigured && (
        <p className="text-sm text-muted-foreground">
          El Active Directory no está configurado en este entorno. Se necesitan
          ad_url, ad_bind_dn, ad_bind_password y ad_user_search_base.
        </p>
      )}
      {state.message && (
        <p
          className={
            state.status === "success"
              ? "text-sm text-emerald-600"
              : "text-sm text-destructive"
          }
        >
          {state.message}
        </p>
      )}
    </div>
  );
}
