import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-10">
      <Skeleton className="h-9 w-96" />
      <div className="flex w-full max-w-md flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 shrink-0" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    </div>
  );
}
