import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/helpers/getSession";
import Link from "next/link";
import { DASHBOARD_CARDS } from "@/lib/constants";

export default async function Dashboard() {
  const session = await getSession();
  const username = session?.user.name;

  return (
    <div className="flex flex-col items-center space-y-10">
      <header className="w-full space-y-4">
        <h1 className="text-center text-3xl font-semibold">
          Sistema para la gestion usuarios
        </h1>
        <h2 className="text-muted-foreground text-center text-2xl font-semibold">
          Bienvenido de vuelta, {username ?? "usuario"}
        </h2>
      </header>
      <section className="grid w-full max-w-md gap-10">
        {DASHBOARD_CARDS.map((card) => (
          <Link href={card.href} key={card.title}>
            <Card className="hover:bg-card-hover gap-4 py-8 text-center">
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
