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
    pageStyle: `
      @page {
        size: A4;
        margin: 12mm;
      }
      @media print {
        body {
          background: #fff !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        body * {
          visibility: hidden;
        }
        [data-print-target],
        [data-print-target] * {
          visibility: visible !important;
        }
        [data-print-target] {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
      }
    `,
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
