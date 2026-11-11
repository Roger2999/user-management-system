"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { revokeOtherSessionsAction } from "../actions/revoke-other-sessions-action";

type Props = {
  count: number;
};

export default function RevokeOtherSessionsDialog({ count }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      const result = await revokeOtherSessionsAction();
      if (result.success) {
        toast.success(result.message ?? "Se cerraron las demás sesiones");
        setOpen(false);
      } else {
        toast.error(result.message ?? "No se pudieron cerrar las sesiones");
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" type="button">
          Cerrar las demás
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <form onSubmit={handleSubmit}>
          <AlertDialogHeader>
            <AlertDialogTitle>Cerrar las demás sesiones</AlertDialogTitle>
            <AlertDialogDescription>
              {count === 1
                ? "Se cerrará la otra sesión abierta y solo quedará activa esta."
                : `Se cerrarán las ${count} otras sesiones abiertas y solo quedará activa esta.`}{" "}
              Conviene usarlo si sospecha que alguien más entró a la cuenta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" size="lg" type="button">
                Cancelar
              </Button>
            </AlertDialogCancel>
            <Button size="lg" type="submit" disabled={pending}>
              {pending ? "Cerrando..." : "Cerrar las demás"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
