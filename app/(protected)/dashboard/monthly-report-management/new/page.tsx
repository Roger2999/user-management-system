import { toLocalDay } from "@/lib/reports/time";
import GenerateForm from "../components/generate-form";
import ImportForm from "../components/import-form";

export default function NewReportPage() {
  // Componente de servidor: se renderiza una vez por petición, así que leer el
  // reloj acá no produce el re-render inestable que la regla de pureza evita.
  // eslint-disable-next-line react-hooks/purity
  const today = toLocalDay(Date.now());
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));

  return (
    <div className="w-full max-w-4xl space-y-6 p-2">
      <header>
        <h1 className="text-2xl font-semibold">Nuevo informe mensual</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Importá uno o varios archivos diarios, o una carpeta completa, y
          después generá el documento. La importación es idempotente por
          SHA-256.
        </p>
      </header>

      <ImportForm defaultYear={year} defaultMonth={month} />
      <GenerateForm defaultYear={year} defaultMonth={month} />
    </div>
  );
}
