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
import { revokeSessionAction } from "../actions/revoke-session-action";

type Props = {
  token: string;
  device: string;
};

export default function RevokeSessionDialog({ token, device }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await revokeSessionAction(formData);
      if (result.success) {
        toast.success(result.message ?? "Sesión cerrada");
        setOpen(false);
      } else {
        toast.error(result.message ?? "No se pudo cerrar la sesión");
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" type="button">
          Revocar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <form onSubmit={handleSubmit}>
          <input type="hidden" name="token" value={token} />
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar esta sesión?</AlertDialogTitle>
            <AlertDialogDescription>
              Se cerrará la sesión abierta en {device}. Si es otro dispositivo,
              tendrá que iniciar sesión de nuevo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" size="lg" type="button">
                Cancelar
              </Button>
            </AlertDialogCancel>
            <Button
              variant="destructive"
              size="lg"
              type="submit"
              disabled={pending}
            >
              {pending ? "Cerrando..." : "Cerrar sesión"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
