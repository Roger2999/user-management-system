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
      <h1>
        Usuarios
        <span className="text-semibold">
          ({filterConfig.label ?? filterValue})
        </span>
        :
      </h1>
      <Suspense fallback={<div>Loading...</div>}>
        <UsersTable where={filterConfig.where} />
      </Suspense>
    </>
  );
}
