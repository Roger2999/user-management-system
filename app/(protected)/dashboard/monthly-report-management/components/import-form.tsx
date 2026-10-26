"use client";

import { useState, type FormEvent } from "react";
import { MONTHS } from "@/lib/reports/document/period";

type Skipped = { unserved: number; internal: number; telemetry: number };

type ImportResponse = {
  status?: "imported" | "already-imported";
  file?: { fileName: string; linesTotal: number; linesInvalid: number };
  days?: string[];
  stats?: { linesTotal: number; linesInvalid: number };
  skipped?: Skipped;
  outsidePeriod?: { day: string; hits: number }[];
  error?: string;
};

function format(value: number): string {
  return value.toLocaleString("es-CU");
}

export default function ImportForm({
  defaultYear,
  defaultMonth,
}: {
  defaultYear: number;
  defaultMonth: number;
}) {
  const [year, setYear] = useState(defaultYear);
  const [month, setMonth] = useState(defaultMonth);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (file === null || uploading) return;

    setUploading(true);
    setProgress(0);
    setResult(null);
    setError(null);

    const request = new XMLHttpRequest();
    request.open("POST", "/api/reports/import");
    request.setRequestHeader("x-file-name", encodeURIComponent(file.name));
    request.setRequestHeader("x-period-year", String(year));
    request.setRequestHeader("x-period-month", String(month));

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    request.onload = () => {
      setUploading(false);
      let data: ImportResponse;
      try {
        data = JSON.parse(request.responseText) as ImportResponse;
      } catch {
        setError("El servidor devolvió una respuesta inválida.");
        return;
      }

      if (request.status >= 200 && request.status < 300) {
        setResult(data);
      } else {
        setError(data.error ?? "No se pudo importar el archivo.");
      }
    };

    request.onerror = () => {
      setUploading(false);
      setError("Se cortó la conexión durante la importación.");
    };

    request.send(file);
  }

  return (
    <section className="rounded-xl border p-5">
      <h2 className="text-lg font-semibold">Importar un log diario</h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Se envía por stream, sin límite de 1 MB. El período define a qué mes
        pertenecen los días; un día ajeno se declara y no se suma.
      </p>

      <form onSubmit={submit} className="mt-4 space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Año
            <input
              type="number"
              min={2000}
              max={2100}
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
              className="bg-background w-28 rounded-md border px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Mes
            <select
              value={month}
              onChange={(event) => setMonth(Number(event.target.value))}
              className="bg-background rounded-md border px-3 py-2 capitalize"
            >
              {MONTHS.map((name, index) => (
                <option key={name} value={index + 1} className="capitalize">
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-56 flex-1 flex-col gap-1 text-sm">
            Archivo
            <input
              type="file"
              accept=".log,text/plain"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="bg-background rounded-md border px-3 py-1.5 file:mr-3 file:rounded file:border-0 file:bg-muted file:px-2 file:py-1 file:text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={file === null || uploading}
            className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm disabled:opacity-50"
          >
            {uploading ? `Importando ${progress}%` : "Importar"}
          </button>
        </div>

        {uploading && (
          <div className="bg-muted h-2 w-full overflow-hidden rounded">
            <div
              className="bg-primary h-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </form>

      {error !== null && (
        <p className="text-destructive mt-4 text-sm">{error}</p>
      )}

      {result?.status === "already-imported" && (
        <p className="mt-4 text-sm">
          <strong>{result.file?.fileName}</strong> ya estaba importado
          (mismo SHA-256). No se duplicó nada.
        </p>
      )}

      {result?.status === "imported" && (
        <div className="mt-4 space-y-1 text-sm">
          <p>
            <strong>{result.file?.fileName}</strong>:{" "}
            {format(result.stats?.linesTotal ?? 0)} líneas,{" "}
            {format(result.stats?.linesInvalid ?? 0)} inválidas. Días
            aportados: {result.days?.join(", ") ?? "—"}.
          </p>
          {result.skipped !== undefined && (
            <p className="text-muted-foreground">
              Descartadas: {format(result.skipped.unserved)} no servidas,{" "}
              {format(result.skipped.internal)} internas y{" "}
              {format(result.skipped.telemetry)} de telemetría.
            </p>
          )}
          {(result.outsidePeriod?.length ?? 0) > 0 && (
            <p className="text-muted-foreground">
              Días ajenos al período (no sumados):{" "}
              {result.outsidePeriod
                ?.map((day) => `${day.day} (${format(day.hits)})`)
                .join(", ")}
              .
            </p>
          )}
        </div>
      )}
    </section>
  );
}
