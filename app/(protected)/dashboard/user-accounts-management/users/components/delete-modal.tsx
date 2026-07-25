"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteUserAccountAction } from "../actions/delete-user-account-action";
import type { DeleteUserAccountState } from "@/lib/types";

const initialState: DeleteUserAccountState = {
  success: false,
  dbErrors: null,
};

interface DeleteModalProps {
  id: string;
  name?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DeleteModal({
  id,
  name,
  open,
  onOpenChange,
}: DeleteModalProps) {
  const [state, action, pending] = useActionState(
    deleteUserAccountAction,
    initialState,
  );

  useEffect(() => {
    if (state.success) {
      toast.success("Solicitud eliminada correctamente");
      onOpenChange(false);
    } else if (state.dbErrors) {
      toast.error(state.dbErrors.message ?? "Error al eliminar la solicitud");
    }
  }, [state, onOpenChange]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <form action={action}>
          <input type="hidden" name="id" value={id} />
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar solicitud?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente
              {name ? ` la solicitud de "${name}"` : " esta solicitud"}.
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
              {pending ? "Eliminando..." : "Eliminar"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
