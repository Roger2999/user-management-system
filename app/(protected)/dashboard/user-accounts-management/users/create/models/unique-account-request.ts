import prisma from "@/lib/prisma";
import { SolicitudCuentaFormData } from "./account-request-schema.model";

const UNIQUE_FIELDS = [
  "folio",
  "identificadorCuentaUsuario",
  "telefonoExtension",
  "telefonoCelular",
  "pcNombre",
  "pcInventario",
  "pcAdicionalNombre",
  "pcAdicionalInventario",
] as const;

export type UniqueAccountRequestField = (typeof UNIQUE_FIELDS)[number];

const FIELD_LABELS: Record<UniqueAccountRequestField, string> = {
  folio: "folio",
  identificadorCuentaUsuario: "identificador de cuenta de usuario",
  telefonoExtension: "teléfono / extensión",
  telefonoCelular: "teléfono celular",
  pcNombre: "nombre de PC",
  pcInventario: "inventario de PC",
  pcAdicionalNombre: "nombre de PC adicional",
  pcAdicionalInventario: "inventario de PC adicional",
};

export async function findDuplicateFields(
  data: SolicitudCuentaFormData,
  excludeId?: string,
): Promise<UniqueAccountRequestField[]> {
  const or = UNIQUE_FIELDS.filter((field) => data[field]).map((field) => ({
    [field]: { equals: data[field], mode: "insensitive" as const },
  }));

  if (or.length === 0) return [];

  const existing = await prisma.accountRequest.findFirst({
    where: {
      OR: or,
      NOT: excludeId ? { id: excludeId } : undefined,
    },
  });

  if (!existing) return [];

  return UNIQUE_FIELDS.filter(
    (field) =>
      existing[field] != null &&
      existing[field].toLowerCase() === data[field]!.toLowerCase(),
  );
}

export function uniqueFieldMessage(field: UniqueAccountRequestField): string {
  return `Ya existe un registro con este ${FIELD_LABELS[field]}`;
}