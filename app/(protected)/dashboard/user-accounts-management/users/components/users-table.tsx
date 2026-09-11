import { Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import Link from "next/link";

import { EyeIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import DropdownMenuTable from "./dropdown-menu-table";
import Pagination from "./pagination";

const PAGE_SIZE = 10;

function getSignatureStage(user: {
  firmadoPorSolicitado: boolean;
  firmadoPorRevisado: boolean;
  firmadoPorAprobado: boolean;
  firmadoPorEjecutado: boolean;
}): { label: string; className: string } {
  if (user.firmadoPorEjecutado) {
    return { label: "Ejecutado", className: "bg-success/15 text-success" };
  }
  if (user.firmadoPorAprobado) {
    return {
      label: "Aprobado",
      className: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    };
  }
  if (user.firmadoPorRevisado) {
    return {
      label: "Revisado",
      className: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
    };
  }
  if (user.firmadoPorSolicitado) {
    return {
      label: "Solicitado",
      className: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
    };
  }
  return { label: "Pendiente", className: "bg-muted text-muted-foreground" };
}

export default async function UsersTable({
  where,
  page,
  searchParams,
  search,
}: {
  where: Prisma.AccountRequestWhereInput;
  page: number;
  searchParams: Record<string, string>;
  search: string | undefined;
}) {
  const usersFiltrated = await prisma.accountRequest.findMany({
    where: search
      ? {
          ...where,
          nombreApellidos: { contains: search, mode: "insensitive" },
        }
      : where,
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  const totalFiltered = await prisma.accountRequest.count({
    where: search
      ? {
          ...where,
          nombreApellidos: { contains: search, mode: "insensitive" },
        }
      : where,
  });

  const totalPages = Math.ceil(totalFiltered / PAGE_SIZE);

  return (
    <div className="flex w-full flex-1 flex-col items-center justify-between">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Folio</TableHead>
            <TableHead>Nombre y Apellidos</TableHead>
            <TableHead>Usuario</TableHead>
            <TableHead>Departamento/Área</TableHead>
            <TableHead className="text-center">Fecha</TableHead>
            <TableHead className="text-center">Estado</TableHead>
            <TableHead className="text-center">Vista previa</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {usersFiltrated.length > 0 ? (
            usersFiltrated.map((user) => {
              const stage = getSignatureStage(user);
              return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.folio}</TableCell>
                  <TableCell className="font-medium">
                    {user.nombreApellidos}
                  </TableCell>
                  <TableCell className="font-medium">
                    {user.identificadorCuentaUsuario}
                  </TableCell>
                  <TableCell className="font-medium">
                    {user.departamentoArea}
                  </TableCell>
                  <TableCell className="text-center whitespace-nowrap">
                    {user.createdAt.toLocaleDateString("es-CU")}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${stage.className}`}
                      >
                        {stage.label}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Link
                      href={`/dashboard/user-accounts-management/users/${user.id}`}
                      aria-label={`Ver solicitud de ${user.nombreApellidos}`}
                    >
                      <EyeIcon className="hover:text-brand mx-auto size-5" />
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenuTable
                      id={user.id}
                      name={user.nombreApellidos}
                    />
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell
                className="text-muted-foreground p-4 text-center text-base"
                colSpan={8}
              >
                No hay cuentas de usuario
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        baseUrl="/dashboard/user-accounts-management/users"
        searchParams={searchParams}
      />
    </div>
  );
}
