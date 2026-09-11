import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <>
      <Skeleton className="h-8 w-48" />
      <div className="bg-form w-md max-w-full space-y-2 rounded-xl border p-10">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="min-h-26 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
        <Skeleton className="mt-4 h-8 w-full rounded-lg" />
      </div>
    </>
  );
}