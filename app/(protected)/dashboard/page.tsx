import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/helpers/getSession";
import Link from "next/link";
import { DASHBOARD_CARDS } from "@/lib/constants";

export default async function Dashboard() {
  const session = await getSession();
  const username = session?.user.name;

  return (
    <div className="flex flex-col items-center space-y-8">
      <header className="w-full space-y-6">
        <h1 className="text-center text-3xl font-semibold">
          Sistema para la gestion usuarios
        </h1>
        <h2 className="text-muted-foreground text-center text-2xl font-semibold">
          Bienvenido de vuelta, {username ?? "usuario"}
        </h2>
      </header>
      <section className="xs:grid-cols-2 grid w-full max-w-5xl gap-10 md:grid-cols-3">
        {DASHBOARD_CARDS.map((card) => (
          <Link href={card.href} key={card.title}>
            <Card className="hover:bg-card-hover min-h-56 justify-evenly gap-0 p-2 text-center">
              <CardHeader>
                {<card.icon className="text-brand mx-auto my-1 size-6" />}
                <CardTitle className="text-xl font-bold">
                  {card.title}{" "}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  );
}
