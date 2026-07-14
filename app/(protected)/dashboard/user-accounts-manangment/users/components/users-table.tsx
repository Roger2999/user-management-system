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

export default async function UsersTable({
  where,
}: {
  where: Prisma.AccountRequestWhereInput;
}) {
  const users = await prisma.accountRequest.findMany({ where });

  return (
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
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.folio}</TableCell>
            <TableCell className="font-medium">
              {user.nombreApellidos}
            </TableCell>
            <TableCell className="font-medium">{user.cuentaUsuario}</TableCell>
            <TableCell className="font-medium">
              {user.telefonoCelular}
            </TableCell>
            <TableCell className="text-center font-medium">
              {user.firmadoPorSolicitado &&
              user.firmadoPorRevisado &&
              user.firmadoPorAprobado &&
              user.firmadoPorEjecutado
                ? "Si"
                : "No"}
            </TableCell>
            <TableCell className="flex justify-center">
              <Link
                href={`/dashboard/user-accounts-manangment/users/${user.id}`}
              >
                <EyeIcon className="hover:text-success" />
              </Link>
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenuTable id={user.id} name={user.nombreApellidos} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
