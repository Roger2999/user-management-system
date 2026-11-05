"use server";

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { loadAdConfig } from "@/modules/ad/config";
import { syncAdDirectory } from "@/modules/ad/sync";
import type { SyncAdDirectoryState } from "@/app/(protected)/dashboard/settings/models/settings-form-states";

/**
 * Sincronización manual del directorio de cuentas con el Active Directory (S5).
 *
 * Vuelve `not-configured` (no error) cuando faltan variables de entorno: la
 * pantalla muestra el motivo y hasta el deploy no cambia nada. Los fallos de
 * de credenciales o de la búsqueda llegan con su mensaje real: es lo único que
 * permite aprovechar la corrida frente al servidor del dominio.
 */
export async function syncAdDirectoryAction(
  _prevState: SyncAdDirectoryState,
): Promise<SyncAdDirectoryState> {
  await requireAdmin();

  let config;
  try {
    config = loadAdConfig(process.env);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { status: "error", message };
  }

  if (config === null) {
    return {
      status: "error",
      message:
        "El Active Directory no está configurado. Se necesitan AD_URL, AD_BIND_DN, AD_BIND_PASSWORD y AD_USER_SEARCH_BASE en el entorno del servidor.",
    };
  }

  try {
    const result = await syncAdDirectory(prisma, config);

    const parts = [
      `${result.created} cuenta(s) creada(s)`,
      `${result.updated} actualizada(s)`,
      `${result.deactivated} deshabilitada(s)`,
    ];

    return {
      status: "success",
      message: `Directorio sincronizado con el dominio: ${parts.join(", ")}.`,
    };
  } catch (error) {
    console.error("syncAdDirectoryAction: no se pudo sincronizar", error);
    return {
      status: "error",
      message:
        "No se pudo sincronizar con el Active Directory. Verifica la red hacia el dominio, las credenciales del servicio y el certificado TLS del DC.",
    };
  }
}
