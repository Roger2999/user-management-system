import { getSession } from "@/helpers/getSession";

export default async function Dashboard() {
  const session = await getSession();
  const username = session?.user.name;

  const stats = [
    { title: "Total de Usuarios", value: "1,247", change: "+12% este mes", color: "bg-blue-50 border-blue-200" },
    { title: "Usuarios Activos", value: "892", change: "+5% esta semana", color: "bg-green-50 border-green-200" },
    { title: "Nuevos Registros", value: "48", change: "+18% este mes", color: "bg-purple-50 border-purple-200" },
    { title: "Cuentas Inactivas", value: "87", change: "-3% esta semana", color: "bg-orange-50 border-orange-200" },
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
          <div
            key={index}
            className={`rounded-xl border p-6 ${stat.color} transition-all hover:scale-105`}
          >
            <h3 className="text-sm font-medium text-muted-foreground">{stat.title}</h3>
            <p className="text-2xl font-bold mt-2">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
