import { Suspense } from "react";
import UsersTable from "./components/users-table";
import { getFilterConfig } from "@/lib/filters";

interface Props {
  searchParams: Promise<{ filter: string | string[] | undefined }>;
}

export default async function UsersPage({ searchParams }: Props) {
  const { filter } = await searchParams;
  const filterValue = typeof filter === "string" ? filter : "all";
  const filterConfig = getFilterConfig(filterValue);

  return (
    <>
      <h1 className="text-2xl font-semibold">
        Usuarios{" "}
        <span className="font-normal">
          ({filterConfig.label ?? filterValue})
        </span>
      </h1>
      <Suspense fallback={<div>Loading...</div>}>
        <UsersTable where={filterConfig.where} />
      </Suspense>
    </>
  );
}
