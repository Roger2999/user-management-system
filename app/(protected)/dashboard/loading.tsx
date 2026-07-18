import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col items-center space-y-8 py-10">
      <div className="flex w-full justify-end">
        <Skeleton className="h-8 w-72" />
      </div>

      <section className="w-full space-y-4">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </section>

      <section className="w-full space-y-4">
        <Skeleton className="h-7 w-40" />
        <div className="grid gap-6 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </section>
    </div>
  );
}
