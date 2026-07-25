import { Suspense } from "react";
import UsersTable from "./components/users-table";
import SuccessToast from "./components/success-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { getFilterConfig } from "@/lib/filters";

interface Props {
  searchParams: Promise<{
    filter: string | string[] | undefined;
    page: string | string[] | undefined;
    success: string | string[] | undefined;
  }>;
}

function TableSkeleton() {
  return (
    <div className="rounded-md border">
      <div className="bg-muted/50 border-b">
        <div className="flex items-center gap-4 px-4 py-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="ml-auto h-4 w-20" />
        </div>
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b px-4 py-4 last:border-0"
        >
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
          <div className="flex w-16 justify-center">
            <Skeleton className="h-5 w-5 rounded" />
          </div>
          <div className="flex w-20 justify-center">
            <Skeleton className="h-5 w-5" />
          </div>
          <div className="ml-auto">
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function UsersPage({ searchParams }: Props) {
  const { filter, page } = await searchParams;
  const filterValue = typeof filter === "string" ? filter : "all";
  const pageValue = typeof page === "string" ? Math.max(1, Number(page) || 1) : 1;
  const filterConfig = getFilterConfig(filterValue);

  const plainSearchParams: Record<string, string> = {};
  if (typeof filter === "string") plainSearchParams.filter = filter;

  return (
    <>
      <Suspense fallback={null}>
        <SuccessToast />
      </Suspense>
      <h1 className="text-2xl font-semibold">
        Usuarios{" "}
        <span className="font-normal">
          ({filterConfig.label ?? filterValue})
        </span>
      </h1>
      <Suspense fallback={<TableSkeleton />}>
        <UsersTable
          where={filterConfig.where}
          page={pageValue}
          searchParams={plainSearchParams}
        />
      </Suspense>
    </>
  );
}
