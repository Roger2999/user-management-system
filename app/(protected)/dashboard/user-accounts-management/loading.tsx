import { Skeleton } from "@/components/ui/skeleton";

function CardSkeleton() {
  return (
    <div className="bg-card ring-foreground/10 flex flex-col gap-4 overflow-hidden rounded-xl p-6 ring-1">
      <div className="grid grid-cols-[1fr_auto] items-start gap-1">
        <Skeleton className="mx-auto h-4 w-28" />
        <Skeleton className="size-6 rounded-md" />
      </div>
      <Skeleton className="mx-auto h-8 w-10" />
    </div>
  );
}

export default function Loading() {
  return (
    <div className="mb-8 flex flex-col gap-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-9 w-80" />
          <Skeleton className="h-7 w-16 rounded-full" />
        </div>
        <Skeleton className="h-10 w-40 rounded-lg" />
      </header>

      <article className="space-y-10">
        <section className="w-full space-y-4">
          <Skeleton className="h-6 w-40" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </section>

        <section className="w-full space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </section>

        <section className="w-full space-y-4">
          <Skeleton className="h-6 w-44" />
          <div className="grid gap-6 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </section>
      </article>
    </div>
  );
}