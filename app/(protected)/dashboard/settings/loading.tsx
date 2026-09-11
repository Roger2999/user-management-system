import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col items-center gap-10">
      <Skeleton className="h-8 w-40" />
      <section className="grid w-7xl max-w-full grid-cols-1 gap-10 md:grid-cols-2">
        <div className="h-full space-y-4">
          <Skeleton className="h-7 w-48" />
          <div className="flex h-full flex-col rounded-xl border p-6">
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="min-h-26 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
            <div className="mt-auto pt-2">
              <Skeleton className="h-8 w-28 rounded-lg" />
            </div>
          </div>
        </div>
        <div className="h-full space-y-4">
          <Skeleton className="h-7 w-44" />
          <div className="flex h-full flex-col rounded-xl border p-6">
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="min-h-26 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
            <div className="mt-auto pt-2">
              <Skeleton className="h-8 w-28 rounded-lg" />
            </div>
          </div>
        </div>
        <div className="md:col-span-2">
          <div className="space-y-4">
            <Skeleton className="h-7 w-44" />
            <div className="space-y-2 rounded-xl border p-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-4 border-b py-2 last:border-b-0"
                >
                  <div className="min-w-0 space-y-2">
                    <Skeleton className="h-4 w-48 max-w-full" />
                    <Skeleton className="h-3 w-64 max-w-full" />
                  </div>
                  <Skeleton className="h-7 w-20 shrink-0 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}