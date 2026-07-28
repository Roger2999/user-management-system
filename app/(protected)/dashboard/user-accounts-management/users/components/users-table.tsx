import { Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import Link from "next/link";

import { EyeIcon, BadgeCheck, XSquare } from "lucide-react";
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

export default async function UsersTable({
  where,
  page,
  searchParams,
}: {
  where: Prisma.AccountRequestWhereInput;
  page: number;
  searchParams: Record<string, string>;
}) {
  const [users, total] = await Promise.all([
    prisma.accountRequest.findMany({
      where,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.accountRequest.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="mt-4 flex w-full flex-1 flex-col items-center justify-between">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Folio</TableHead>
            <TableHead>Nombre y Apellidos</TableHead>
            <TableHead>Usuario</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead className="text-center">Firmado</TableHead>
            <TableHead className="text-center">Vista previa</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length > 0 ? (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.folio}</TableCell>
                <TableCell className="font-medium">
                  {user.nombreApellidos}
                </TableCell>
                <TableCell className="font-medium">
                  {user.cuentaUsuario}
                </TableCell>
                <TableCell className="font-medium">
                  {user.telefonoCelular}
                </TableCell>
                <TableCell>
                  {user.firmadoPorSolicitado &&
                  user.firmadoPorRevisado &&
                  user.firmadoPorAprobado &&
                  user.firmadoPorEjecutado ? (
                    <BadgeCheck className="text-success m-auto size-6" />
                  ) : (
                    <XSquare className="text-destructive m-auto size-6" />
                  )}
                </TableCell>
                <TableCell className="flex justify-center">
                  <Link
                    href={`/dashboard/user-accounts-management/users/${user.id}`}
                  >
                    <EyeIcon className="hover:text-brand size-8" />
                  </Link>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenuTable id={user.id} name={user.nombreApellidos} />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                className="text-destructive p-4 text-center text-xl"
                colSpan={10}
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
