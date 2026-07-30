import { Suspense } from "react";
import UsersTable from "./components/users-table";
import SuccessToast from "./components/success-toast";
import { getFilterConfig } from "@/lib/filters";
import TableSkeleton from "./components/table-skeleton";
import SearchBar from "./components/search-bar";

interface Props {
  searchParams: Promise<{
    filter: string | string[] | undefined;
    page: string | string[] | undefined;
    success: string | string[] | undefined;
    search: string | undefined;
  }>;
}

export default async function UsersPage({ searchParams }: Props) {
  const { filter, page, search } = await searchParams;
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
      <SearchBar />
      <Suspense fallback={<TableSkeleton />}>
        <UsersTable
          where={filterConfig.where}
          page={pageValue}
          searchParams={plainSearchParams}
          search={search}
        />
      </Suspense>
    </>
  );
}
