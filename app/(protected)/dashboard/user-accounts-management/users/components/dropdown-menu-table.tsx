"use client";
import { useState } from "react";
import {
  MoreHorizontalIcon,
  PencilIcon,
  PenLineIcon,
  Trash2Icon,
} from "lucide-react";
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
            <MoreHorizontalIcon className="size-6" />
            <span className="sr-only">Abrir menú</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="flex min-w-40 flex-col gap-4"
        >
          <DropdownMenuItem asChild>
            <Link
              href={`/dashboard/user-accounts-management/users/edit/${id}`}
              className="flex w-full justify-around text-xl"
            >
              <PencilIcon className="size-5" />
              Editar
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href={`/dashboard/user-accounts-management/users/sign/${id}`}
              className="flex w-full justify-around text-xl"
            >
              <PenLineIcon className="size-5" />
              Firmar
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex justify-around text-xl"
            variant="destructive"
            onSelect={(e) => {
              e.preventDefault();
              setOpen(true);
            }}
          >
            <Trash2Icon className="size-5" />
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
