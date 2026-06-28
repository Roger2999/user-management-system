import { Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import Link from "next/link";

import { MoreHorizontalIcon, EyeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
          <TableHead className="text-center">Detalles</TableHead>
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
            <TableCell className="flex justify-center">
              <Link href={`/dashboard/users/${user.id}`}>
                <EyeIcon className="hover:text-green-500" />
              </Link>
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8">
                    <MoreHorizontalIcon />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Edit</DropdownMenuItem>
                  <DropdownMenuItem>Duplicate</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive">
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
