import type { Prisma } from "@/generated/prisma/client";

export interface FilterConfig {
  value: string;
  label: string;
  where: Prisma.AccountRequestWhereInput;
}

export const filtersByAllUsers: FilterConfig[] = [
  { value: "all", label: "Total de cuentas", where: {} },
];

export const filtersByRequestType: FilterConfig[] = [
  {
    value: "alta",
    label: "Alta",
    where: { tipoSolicitud: "ALTA" },
  },
  {
    value: "actualizacion",
    label: "Actualización",
    where: { tipoSolicitud: "ACTUALIZACION" },
  },
  {
    value: "bajaEntidad",
    label: "Baja",
    where: { bajaEntidad: true },
  },
];
export const filtersByAccountType: FilterConfig[] = [
  {
    value: "permanente",
    label: "Cuentas permanentes",
    where: { tipoCuenta: "PERMANENTE" },
  },
  {
    value: "temporal",
    label: "Cuentas temporales",
    where: { tipoCuenta: "TEMPORAL" },
  },
];
export const expiredAccountsFilter: FilterConfig[] = [
  {
    value: "expiradas",
    label: "Cuentas expiradas",
    get where(): Prisma.AccountRequestWhereInput {
      return {
        tipoCuenta: "TEMPORAL",
        fechaExpiracion: { lt: new Date() },
      };
    },
  },
];

export const expiringAccountsFilter: FilterConfig[] = [
  {
    value: "expiring7",
    label: "Expiran en ≤7 días",
    get where(): Prisma.AccountRequestWhereInput {
      const now = new Date();
      const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return {
        tipoCuenta: "TEMPORAL",
        fechaExpiracion: { gte: now, lte: in7Days },
      };
    },
  },
  {
    value: "expiring1",
    label: "Expiran en ≤1 día",
    get where(): Prisma.AccountRequestWhereInput {
      const now = new Date();
      const in1Day = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      return {
        tipoCuenta: "TEMPORAL",
        fechaExpiracion: { gte: now, lte: in1Day },
      };
    },
  },
];
export const pendingSignatureFilter: FilterConfig[] = [
  {
    value: "pendientesFirma",
    label: "Pendientes de firma",
    where: {
      OR: [
        { firmadoPorAprobado: false },
        { firmadoPorEjecutado: false },
        { firmadoPorRevisado: false },
        { firmadoPorSolicitado: false },
      ],
    },
  },
];
export const allFilters: FilterConfig[] = [
  ...filtersByAllUsers,
  ...filtersByRequestType,
  ...filtersByAccountType,
  ...pendingSignatureFilter,
  ...expiredAccountsFilter,
  ...expiringAccountsFilter,
];

export function getFilterConfig(value: string): FilterConfig {
  return allFilters.find((f) => f.value === value) ?? filtersByAllUsers[0];
}
