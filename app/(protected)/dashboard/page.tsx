import { getSession } from "@/helpers/getSession";
import { UsersIcon } from "lucide-react";
import { DashboardCard } from "./components/DashboardCard";

export default async function Dashboard() {
  const session = await getSession();
  const username = session?.user.username;
  const isAdmin = session?.user.role === "ADMIN";

  return (
    <div className="flex flex-col items-center space-y-10">
      <header className="w-full space-y-4">
        <h1 className="text-center text-3xl font-semibold">
          Sistema para la gestion de usuarios
        </h1>
        <h2 className="text-muted-foreground text-center text-2xl font-semibold">
          Bienvenido de vuelta, {username ?? "usuario"}
        </h2>
      </header>
      <section className="grid w-full max-w-md gap-10">
        <DashboardCard
          isAdmin={isAdmin}
          icon={<UsersIcon className="text-brand mx-auto my-1 size-6" />}
          card={{
            title: "Gestionar cuentas de usuario",
            description:
              "Registra, firma, actualiza y da de baja cuentas de usuario",
            href: "/dashboard/user-accounts-management/",
          }}
        />
        <DashboardCard
          isAdmin={isAdmin}
          icon={<UsersIcon className="text-brand mx-auto my-1 size-6" />}
          card={{
            title: "Gestionar informes mensuales",
            description:
              "Gestión integral de informes mensuales de seguridad informática",
            href: "/dashboard/monthly-report-management/",
          }}
        />
      </section>
    </div>
  );
}
