import { getSession } from "@/helpers/getSession";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { FILTERS } from "@/lib/filters";

export default async function Dashboard() {
  const session = await getSession();
  const username = session?.user.name;

  const counts = await Promise.all(
    FILTERS.map((f) => prisma.accountRequest.count({ where: f.where })),
  );

  return (
    <div className="flex flex-col items-center space-y-6 py-10">
      <div className="flex items-center justify-end gap-5">
        <h1 className="text-2xl font-semibold text-muted-foreground">
          Bienvenido de vuelta, {username}
        </h1>
      </div>
      <h2 className="text-start text-xl w-full">Estadísticas</h2>
      <ul className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 w-full">
        {FILTERS.map((filter, i) => (
          <li
            key={filter.value}
            className="transition-all duration-100 ease-in hover:scale-105"
          >
            <Link
              href={`/dashboard/users?filter=${encodeURIComponent(filter.value)}`}
            >
              <Card className="p-6 transition-shadow hover:shadow-lg min-h-40">
                <CardHeader>
                  <CardTitle className="text-xl text-center font-medium text-muted-foreground min-h-20">
                    {filter.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center text-2xl">
                  <p>{counts[i]}</p>
                </CardContent>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
