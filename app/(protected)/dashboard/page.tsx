import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSession } from "@/helpers/getSession";
import Link from "next/link";

export default async function Dashboard() {
  const session = await getSession();
  const username = session?.user.name;
  const dashboardCards = [
    {
      title: "Gestionar cuentas de usuario",
      description: "Altas, bajas y firma cuentas de usuario pendientes",
      href: "/dashboard/user-accounts-manangment/",
    },
    {
      title: "Gestionar incidentes de ciberseguridad",
      description: "Administra los incidentes que se producen en la empresa",
      href: "/dashboard/user-accounts-manangment/",
    },
    {
      title: "Gestionar Servidores y servicios",
      description:
        "Gestion de servidores de la empresa y servicios que se brindan",
      href: "/dashboard/user-accounts-manangment/",
    },
  ];
  return (
    <div className="flex flex-col items-center space-y-8 py-10">
      <header className="w-full space-y-6">
        <h1 className="text-3xl font-semibold text-center">
          Sistema para la gestion usuarios
        </h1>
        <h2 className="text-2xl font-semibold text-muted-foreground text-center">
          Bienvenido de vuelta, {username ?? "usuario"}
        </h2>
      </header>
      <section className="grid xs:grid-cols-2  md:grid-cols-3 gap-4 w-full sm:px-20">
        {dashboardCards.map((card) => (
          <Link href={card.href} key={card.title}>
            <Card className="text-center min-h-52">
              <CardHeader>
                <CardTitle className="text-xl font-bold">
                  {card.title}{" "}
                </CardTitle>
                <CardDescription>
                  <p className="text-muted-foreground">{card.description}</p>
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  );
}
