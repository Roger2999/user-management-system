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
    <div className="mb-8 flex flex-col items-center gap-6">
      <header className="w-full max-w-5xl space-y-6">
        <Skeleton className="mx-auto h-9 w-80" />
        <div className="flex justify-center">
          <Skeleton className="h-10 w-40 rounded-lg" />
        </div>
      </header>

      <article className="w-full max-w-5xl space-y-10">
        <section className="w-full space-y-4">
          <Skeleton className="h-6 w-44" />
          <div className="grid gap-6">
            <CardSkeleton />
          </div>
        </section>

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
