import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col items-center space-y-10">
      <header className="w-full space-y-4">
        <Skeleton className="mx-auto h-9 w-80" />
        <Skeleton className="mx-auto h-7 w-72" />
      </header>

      <section className="grid w-full max-w-md gap-10">
        <div className="bg-card ring-foreground/10 flex flex-col items-center gap-4 overflow-hidden rounded-xl py-8 text-center ring-1">
          <Skeleton className="my-1 size-6 rounded-md" />
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
      </section>
    </div>
  );
}
