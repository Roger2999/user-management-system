import { getSession } from "@/helpers/getSession";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default async function Dashboard() {
  const session = await getSession();
  const username = session?.user.name;

  const stats = [
    { title: "Total de Usuarios", value: "1,247", change: "+12% este mes", trend: "up" },
    { title: "Usuarios Activos", value: "892", change: "+5% esta semana", trend: "up" },
    { title: "Nuevos Registros", value: "48", change: "+18% este mes", trend: "up" },
    { title: "Cuentas Inactivas", value: "87", change: "-3% esta semana", trend: "down" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Bienvenido de vuelta, {username}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="p-6 transition-shadow hover:shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-end justify-between gap-2">
                <div>
                  <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                  <CardDescription className="mt-1 flex items-center gap-1">
                    <span
                      className={`text-xs font-medium ${
                        stat.trend === "up" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {stat.change}
                    </span>
                  </CardDescription>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
