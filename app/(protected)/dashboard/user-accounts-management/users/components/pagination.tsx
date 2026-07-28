import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  searchParams: Record<string, string>;
}

export default function Pagination({
  currentPage,
  totalPages,
  baseUrl,
  searchParams,
}: Props) {
  if (totalPages <= 1) return null;

  function buildUrl(page: number) {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(page));
    return `${baseUrl}?${params.toString()}`;
  }

  return (
    <div className="mb-4 flex items-center justify-center gap-4">
      <p className="text-muted-foreground text-sm">
        Pagina {currentPage} de {totalPages}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          asChild={currentPage > 1}
        >
          {currentPage > 1 ? (
            <Link href={buildUrl(currentPage - 1)} className="flex gap-1">
              <ChevronLeft className="mr-1 size-4" />
              Anterior
            </Link>
          ) : (
            <span className="flex gap-1">
              <ChevronLeft className="mr-1 size-4" />
              Anterior
            </span>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          asChild={currentPage < totalPages}
        >
          {currentPage < totalPages ? (
            <Link href={buildUrl(currentPage + 1)} className="flex gap-4">
              Siguiente
              <ChevronRight className="ml-1 size-4" />
            </Link>
          ) : (
            <span className="flex gap-1">
              Siguiente
              <ChevronRight className="ml-1 size-4" />
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
