import { Skeleton } from "@/components/ui/skeleton";

function CardSkeleton({ wide = false }: { wide?: boolean }) {
  return (
    <div className="flex flex-col gap-4 overflow-hidden rounded-xl bg-card p-6 ring-1 ring-foreground/10">
      <div className="grid grid-cols-[1fr_auto] items-start gap-1">
        <Skeleton className="mx-auto h-4 w-28" />
        <Skeleton className="size-6 rounded-md" />
      </div>
      <Skeleton className={wide ? "mx-auto h-8 w-16" : "mx-auto h-8 w-10"} />
    </div>
  );
}

export default function Loading() {
  return (
    <div className="flex flex-col gap-10 items-center">
      <header className="w-full space-y-2">
        <Skeleton className="mx-auto h-9 w-80" />
        <Skeleton className="mx-auto h-6 w-72" />
      </header>

      <article className="w-full max-w-5xl space-y-10">
        <section className="w-full flex flex-col gap-4">
          <CardSkeleton wide />
        </section>

        <section className="w-full space-y-4">
          <Skeleton className="h-6 w-44" />
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </section>

        <section className="w-full space-y-4">
          <Skeleton className="h-6 w-36" />
          <div className="grid gap-6 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </section>

        <section className="w-full space-y-4">
          <Skeleton className="h-6 w-40" />
          <div className="grid gap-4">
            <CardSkeleton />
          </div>
        </section>
      </article>
    </div>
  );
}
