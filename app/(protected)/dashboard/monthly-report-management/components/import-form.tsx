"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { MONTHS } from "@/lib/reports/document/period";
import {
  filterLogFiles,
  relativeName,
} from "@/lib/reports/import-selection";

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

type FileResult = {
  file: string;
  response?: ImportResponse;
  error?: string;
};

type Mode = "files" | "folder";

function format(value: number): string {
  return value.toLocaleString("es-CU");
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Sube un archivo con el cuerpo crudo, igual que la importación individual.
 *
 * No se usa `FormData`: el route handler lee `request.body` como stream para no
 * cargar 90 MB en memoria ni chocar con el límite de 1 MB de las server actions.
 * El nombre y el período viajan en cabeceras.
 */
function uploadFile(
  file: File,
  year: number,
  month: number,
  onProgress: (loaded: number) => void,
  onUploaded: () => void,
): Promise<ImportResponse> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", "/api/reports/import");
    request.setRequestHeader(
      "x-file-name",
      encodeURIComponent(relativeName(file)),
    );
    request.setRequestHeader("x-period-year", String(year));
    request.setRequestHeader("x-period-month", String(month));

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded);
    };
    request.upload.onload = () => onUploaded();

    request.onload = () => {
      let data: ImportResponse;
      try {
        data = JSON.parse(request.responseText) as ImportResponse;
      } catch {
        reject(new Error("El servidor devolvió una respuesta inválida."));
        return;
      }

      if (request.status >= 200 && request.status < 300) {
        resolve(data);
      } else {
        reject(new Error(data.error ?? "No se pudo importar el archivo."));
      }
    };

    request.onerror = () => {
      reject(new Error("Se cortó la conexión durante la importación."));
    };

    request.send(file);
  });
}

function Results({ results }: { results: FileResult[] }) {
  const imported = results.filter(
    (result) => result.response?.status === "imported",
  ).length;
  const already = results.filter(
    (result) => result.response?.status === "already-imported",
  ).length;
  const failed = results.filter((result) => result.error !== undefined).length;

  return (
    <div className="mt-4 space-y-2">
      <p className="text-sm font-medium">
        {imported} importado(s), {already} ya estaban, {failed} con error.
      </p>
      <ul className="max-h-80 space-y-1 overflow-auto text-sm">
        {results.map((result) => {
          const response = result.response;

          return (
            <li key={result.file} className="rounded border px-3 py-2">
              <p className="font-medium break-all">{result.file}</p>
              {result.error !== undefined ? (
                <p className="text-destructive">{result.error}</p>
              ) : response?.status === "already-imported" ? (
                <p className="text-muted-foreground">
                  Ya estaba importado (mismo SHA-256). No se duplicó nada.
                </p>
              ) : (
                <div className="text-muted-foreground space-y-1">
                  <p>
                    {format(response?.stats?.linesTotal ?? 0)} líneas,{" "}
                    {format(response?.stats?.linesInvalid ?? 0)} inválidas.
                    Días: {response?.days?.join(", ") ?? "—"}.
                  </p>
                  {response !== undefined &&
                    response.skipped !== undefined && (
                      <p>
                        Descartadas: {format(response.skipped.unserved)} no
                        servidas e {format(response.skipped.internal)} internas.
                        Telemetría fuera de las tablas:{" "}
                        {format(response.skipped.telemetry)}.
                      </p>
                    )}
                  {response !== undefined &&
                    (response.outsidePeriod?.length ?? 0) > 0 && (
                      <p>
                        Días ajenos al período (no sumados):{" "}
                        {response.outsidePeriod
                          ?.map((day) => `${day.day} (${format(day.hits)})`)
                          .join(", ")}
                        .
                      </p>
                    )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
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
  const [mode, setMode] = useState<Mode>("files");
  const [files, setFiles] = useState<File[]>([]);
  const [ignored, setIgnored] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [phase, setPhase] = useState<"sending" | "processing">("sending");
  const [progress, setProgress] = useState(0);
  const [current, setCurrent] = useState<{
    index: number;
    name: string;
    loaded: number;
    total: number;
  } | null>(null);
  const [results, setResults] = useState<FileResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const folderInput = useRef<HTMLInputElement>(null);

  // `webkitdirectory` no está en los tipos de React: se pone sobre el nodo para
  // que el input abra el selector de carpeta en Chromium, Edge y Safari.
  useEffect(() => {
    const input = folderInput.current;
    if (input === null) return;

    input.setAttribute("webkitdirectory", "");
    input.setAttribute("directory", "");
  }, [mode]);

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);

  function selectFiles(list: FileList | null): void {
    const filtered = filterLogFiles(Array.from(list ?? []));
    setFiles(filtered.accepted);
    setIgnored(filtered.ignored);
    setResults([]);
    setError(null);
  }

  function switchMode(next: Mode): void {
    if (next === mode) return;

    setMode(next);
    setFiles([]);
    setIgnored(0);
    setResults([]);
    setError(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (files.length === 0 || uploading) return;

    if (!Number.isInteger(year) || !Number.isInteger(month)) {
      setError("Período inválido.");
      return;
    }

    setUploading(true);
    setProgress(0);
    setResults([]);
    setError(null);

    const total = files.reduce((sum, file) => sum + file.size, 0);
    let completed = 0;
    const collected: FileResult[] = [];

    for (const [index, file] of files.entries()) {
      const name = relativeName(file);
      setPhase("sending");
      setCurrent({ index, name, loaded: 0, total: file.size });

      try {
        const response = await uploadFile(
          file,
          year,
          month,
          (loaded) => {
            setCurrent({ index, name, loaded, total: file.size });
            setProgress(
              total === 0
                ? 0
                : Math.round(((completed + loaded) / total) * 100),
            );
          },
          () => setPhase("processing"),
        );
        collected.push({ file: name, response });
      } catch (uploadError) {
        collected.push({
          file: name,
          error:
            uploadError instanceof Error
              ? uploadError.message
              : "No se pudo importar el archivo.",
        });
      }

      completed += file.size;
      setProgress(total === 0 ? 100 : Math.round((completed / total) * 100));
      setResults([...collected]);
    }

    setUploading(false);
    setCurrent(null);
  }

  return (
    <section className="rounded-xl border p-5">
      <h2 className="text-lg font-semibold">Importar logs diarios</h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Elegí uno o varios archivos, o una carpeta completa. Se envían por
        stream, sin límite de 1 MB. El período define a qué mes pertenecen los
        días; un día ajeno se declara y no se suma.
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
              disabled={uploading}
              className="bg-background w-28 rounded-md border px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Mes
            <select
              value={month}
              onChange={(event) => setMonth(Number(event.target.value))}
              disabled={uploading}
              className="bg-background rounded-md border px-3 py-2 capitalize"
            >
              {MONTHS.map((name, index) => (
                <option key={name} value={index + 1} className="capitalize">
                  {name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-col gap-1 text-sm">
            <span>Origen</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => switchMode("files")}
                disabled={uploading}
                className={`rounded-md border px-3 py-2 text-sm ${
                  mode === "files"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background"
                }`}
              >
                Archivo(s)
              </button>
              <button
                type="button"
                onClick={() => switchMode("folder")}
                disabled={uploading}
                className={`rounded-md border px-3 py-2 text-sm ${
                  mode === "folder"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background"
                }`}
              >
                Carpeta
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="flex min-w-56 flex-1 flex-col gap-1 text-sm">
            {mode === "files" ? "Archivos" : "Carpeta"}
            {mode === "files" ? (
              <input
                type="file"
                multiple
                accept=".log,.txt,text/plain"
                onChange={(event) => {
                  selectFiles(event.target.files);
                  event.target.value = "";
                }}
                disabled={uploading}
                className="bg-background rounded-md border px-3 py-1.5 file:mr-3 file:rounded file:border-0 file:bg-muted file:px-2 file:py-1 file:text-sm"
              />
            ) : (
              <input
                ref={folderInput}
                type="file"
                multiple
                onChange={(event) => {
                  selectFiles(event.target.files);
                  event.target.value = "";
                }}
                disabled={uploading}
                className="bg-background rounded-md border px-3 py-1.5 file:mr-3 file:rounded file:border-0 file:bg-muted file:px-2 file:py-1 file:text-sm"
              />
            )}
          </label>
          <button
            type="submit"
            disabled={files.length === 0 || uploading}
            className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm disabled:opacity-50"
          >
            {uploading
              ? `Importando ${progress}%`
              : `Importar${files.length > 0 ? ` (${files.length})` : ""}`}
          </button>
        </div>

        {files.length > 0 && (
          <p className="text-muted-foreground text-sm">
            {files.length} archivo(s), {formatBytes(totalBytes)}. Orden:{" "}
            {files
              .slice(0, 3)
              .map((file) => relativeName(file))
              .join(", ")}
            {files.length > 3 ? "…" : ""}.
          </p>
        )}

        {ignored > 0 && (
          <p className="text-muted-foreground text-sm">
            {ignored} archivo(s) ignorado(s): solo se importan <code>.log</code>{" "}
            y <code>.txt</code>.
          </p>
        )}

        {uploading && current !== null && (
          <div className="space-y-1">
            <p className="text-sm">
              {current.index + 1} de {files.length}:{" "}
              <span className="break-all">{current.name}</span> —{" "}
              {phase === "processing"
                ? "procesando en el servidor…"
                : `${Math.round(
                    (current.loaded / Math.max(current.total, 1)) * 100,
                  )}%`}
            </p>
            <div className="bg-muted h-2 w-full overflow-hidden rounded">
              <div
                className="bg-primary h-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </form>

      {error !== null && (
        <p className="text-destructive mt-4 text-sm">{error}</p>
      )}

      {results.length > 0 && <Results results={results} />}
    </section>
  );
}
