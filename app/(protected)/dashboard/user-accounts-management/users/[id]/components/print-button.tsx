"use client";

import type { RefObject } from "react";
import { useReactToPrint } from "react-to-print";

interface Props {
  contentRef: RefObject<HTMLDivElement | null>;
}

export const PrintButton = ({ contentRef }: Props) => {
  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: "Solicitud de cuenta de usuario",
    copyShadowRoots: true,
  });

  return (
    <button
      type="button"
      onClick={() => handlePrint()}
      className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium shadow-sm transition hover:opacity-90"
    >
      Imprimir / Guardar como PDF
    </button>
  );
};
