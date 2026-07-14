"use client";
import { useState } from "react";
import { MoreHorizontalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import DeleteModal from "./delete-modal";

export default function DropdownMenuTable({
  id,
  name,
}: {
  id?: string;
  name?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontalIcon />
            <span className="sr-only">Abrir menú</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <Link href={`/dashboard/user-accounts-manangment/users/edit/${id}`}>
            <DropdownMenuItem>Editar</DropdownMenuItem>
          </Link>
          <Link href={`/dashboard/user-accounts-manangment/users/sign/${id}`}>
            <DropdownMenuItem>Firmar</DropdownMenuItem>
          </Link>
          <DropdownMenuItem
            variant="destructive"
            onSelect={(e) => {
              e.preventDefault();
              setOpen(true);
            }}
          >
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {id && (
        <DeleteModal id={id} name={name} open={open} onOpenChange={setOpen} />
      )}
    </>
  );
}
