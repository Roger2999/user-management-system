"use client";

export const PrintButton = () => {
  const handlePrint = () => window.print();

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium shadow-sm transition hover:opacity-90"
    >
      Imprimir / Guardar como PDF
    </button>
  );
};
