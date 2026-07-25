"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

export default function SuccessToast() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");

  useEffect(() => {
    if (success === "created") {
      toast.success("Solicitud creada correctamente");
    } else if (success === "updated") {
      toast.success("Solicitud actualizada correctamente");
    }
  }, [success]);

  return null;
}
