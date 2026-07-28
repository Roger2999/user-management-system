import { Suspense } from "react";
import UsersTable from "./components/users-table";
import SuccessToast from "./components/success-toast";
import { getFilterConfig } from "@/lib/filters";
import TableSkeleton from "./components/table-skeleton";

interface Props {
  searchParams: Promise<{
    filter: string | string[] | undefined;
    page: string | string[] | undefined;
    success: string | string[] | undefined;
  }>;
}

export default async function UsersPage({ searchParams }: Props) {
  const { filter, page } = await searchParams;
  const filterValue = typeof filter === "string" ? filter : "all";
  const pageValue =
    typeof page === "string" ? Math.max(1, Number(page) || 1) : 1;
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
