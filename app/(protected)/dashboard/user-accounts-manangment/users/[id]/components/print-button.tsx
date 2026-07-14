"use client";

export const PrintButton = () => {
  const handlePrint = () => window.print();

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
    >
      Imprimir / Guardar como PDF
    </button>
  );
};
