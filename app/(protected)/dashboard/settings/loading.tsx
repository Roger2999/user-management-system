import { Skeleton } from "@/components/ui/skeleton";
import FormCardSkeleton from "./components/form-card-skeleton";

export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-10 px-5">
      <div className="w-full space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      <div className="flex w-full items-center gap-4 rounded-xl border p-6">
        <Skeleton className="size-12 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-52 max-w-full" />
          <Skeleton className="h-3 w-72 max-w-full" />
        </div>
        <Skeleton className="h-6 w-24 shrink-0 rounded-full" />
      </div>

      <div className="flex w-full flex-col gap-6">
        <div className="space-y-1">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <FormCardSkeleton fields={3} />
          <FormCardSkeleton fields={3} />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-40" />
          <div className="space-y-2 rounded-xl border p-6">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
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
    </div>
  );
}
