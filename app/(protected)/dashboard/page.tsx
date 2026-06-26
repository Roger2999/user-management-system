import { getSession } from "@/helpers/getSession";
import prisma from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import {
  filtersByAccountType,
  filtersByRequestType,
  pendingSignatureFilter,
} from "@/lib/filters";
import { cn } from "@/lib/utils";

export default async function Dashboard() {
  const session = await getSession();
  const username = session?.user.name;

  const allUsersCount = await prisma.accountRequest.count();

  const usersRequesTypeCount = await Promise.all(
    filtersByRequestType.map((f) =>
      prisma.accountRequest.count({ where: f.where }),
    ),
  );
  const usersAccountTypeCount = await Promise.all(
    filtersByAccountType.map((f) =>
      prisma.accountRequest.count({ where: f.where }),
    ),
  );
  const usersPendingSignatureCount = await Promise.all(
    pendingSignatureFilter.map((f) =>
      prisma.accountRequest.count({ where: f.where }),
    ),
  );
  return (
    <div className="flex flex-col items-center space-y-6 py-10">
      <div className="flex items-center justify-end gap-5">
        <h1 className="text-2xl font-semibold text-muted-foreground">
          Bienvenido de vuelta, {username}
        </h1>
      </div>
      <h2 className="text-start text-xl w-full">Estadísticas</h2>
      <ul className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 w-full ">
        {/* all users */}
        <li className="col-span-6 flex flex-col gap-4">
          <Link href={`/dashboard/users?filter=${encodeURIComponent("all")}`}>
            <Card className="p-6 hover:shadow-lg transition-all duration-100 ease-in hover:scale-102">
              <CardHeader>
                <CardTitle className="text-xl text-center font-medium text-muted-foreground">
                  Total de cuentas
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl">
                <p className="text-center col-span-4">{allUsersCount}</p>
              </CardContent>
            </Card>
          </Link>
          <ul className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtersByRequestType.map((filter, i) => (
              <li key={i}>
                <Link
                  key={i}
                  className="w-full transition-all duration-100 ease-in hover:scale-105"
                  href={`/dashboard/users?filter=${encodeURIComponent(filter.value)}`}
                >
                  <Card className="flex flex-col justify-center hover:shadow-lg transition-all duration-100 ease-in hover:scale-105">
                    <CardHeader>
                      <CardTitle className="text-xl text-center font-medium text-muted-foreground">
                        {filter.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl text-center">
                      <p>{usersRequesTypeCount[i]}</p>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}{" "}
          </ul>
        </li>

        {/* by account type */}

        {filtersByAccountType.map((filter, i) => (
          <li key={filter.value} className="">
            <Link
              href={`/dashboard/users?filter=${encodeURIComponent(filter.value)}`}
            >
              <Card className="p-6  hover:shadow-lg transition-all duration-100 ease-in hover:scale-105">
                <CardHeader>
                  <CardTitle className="text-xl text-center font-medium text-muted-foreground min-h-20">
                    {filter.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center text-2xl">
                  <p>{usersAccountTypeCount[i]}</p>
                </CardContent>
              </Card>
            </Link>
          </li>
        ))}
        {/* by pendingFirm */}
        {usersPendingSignatureCount.length > 0 && (
          <div className="col-span-6">
            {pendingSignatureFilter.map((filter, i) => (
              <li key={filter.value}>
                <Link
                  href={`/dashboard/users?filter=${encodeURIComponent(filter.value)}`}
                >
                  <Card
                    className={cn(
                      "transition-all duration-100 ease-in hover:scale-105 hover:shadow-lg gap-0",
                      usersPendingSignatureCount[i] !== 0 && "bg-red-500/20",
                    )}
                  >
                    <CardHeader>
                      <CardTitle className="text-xl text-center font-medium text-muted-foreground">
                        {filter.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl text-center">
                      <p>{usersPendingSignatureCount[i]}</p>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </div>
        )}
      </ul>
    </div>
  );
}
