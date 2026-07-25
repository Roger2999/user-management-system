import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/helpers/getSession";
import Link from "next/link";
import {
  UsersIcon,
  ShieldAlertIcon,
  ServerIcon,
  LucideIcon,
} from "lucide-react";

export default async function Dashboard() {
  const session = await getSession();
  const username = session?.user.name;
  const dashboardCards: {
    title: string;
    description: string;
    href: string;
    icon: LucideIcon;
  }[] = [
    {
      title: "Gestionar cuentas de usuario",
      description: "Altas, bajas y firma cuentas de usuario pendientes",
      href: "/dashboard/user-accounts-management/",
      icon: UsersIcon,
    },
    {
      title: "Gestionar incidentes de ciberseguridad",
      description: "Administra los incidentes que se producen en la empresa",
      href: "/dashboard/user-accounts-management/",
      icon: ShieldAlertIcon,
    },
    {
      title: "Gestionar Servidores y servicios",
      description:
        "Gestion de servidores de la empresa y servicios que se brindan",
      href: "/dashboard/user-accounts-management/",
      icon: ServerIcon,
    },
  ];
  return (
    <div className="flex flex-col items-center space-y-8 py-10">
      <header className="w-full space-y-6">
        <h1 className="text-center text-3xl font-semibold">
          Sistema para la gestion usuarios
        </h1>
        <h2 className="text-muted-foreground text-center text-2xl font-semibold">
          Bienvenido de vuelta, {username ?? "usuario"}
        </h2>
      </header>
      <section className="xs:grid-cols-2 grid w-full max-w-5xl gap-10 md:grid-cols-3">
        {dashboardCards.map((card) => (
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
