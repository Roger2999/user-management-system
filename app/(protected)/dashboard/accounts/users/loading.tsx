import { Skeleton } from "@/components/ui/skeleton";
import TableSkeleton from "./components/table-skeleton";

export default function Loading() {
  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-12 w-40 rounded-md" />
      </header>
      <div className="flex justify-center">
        <Skeleton className="h-12 w-md max-w-full" />
      </div>
      <TableSkeleton />
    </>
  );
}