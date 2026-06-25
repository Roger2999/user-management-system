import { Suspense } from "react";
import UsersTable from "./components/users-table";
import { getFilter } from "@/lib/filters";

interface Props {
  searchParams: Promise<{ filter: string | string[] | undefined }>;
}

export default async function UsersPage({ searchParams }: Props) {
  const { filter } = await searchParams;
  const filterStr = typeof filter === "string" ? filter : "all";
  const filterConfig = getFilter(filterStr);

  return (
    <>
      <h1>
        Usuarios
        <span className="text-semibold">
          ({filterConfig?.label ?? filterStr})
        </span>
        :
      </h1>
      <Suspense fallback={<div>Loading...</div>}>
        <UsersTable filterConfig={filterConfig} />
      </Suspense>
    </>
  );
}
