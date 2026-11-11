import { getSession } from "@/lib/getSession";
import SettingsNav from "./components/settings-nav";

export default async function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const isAdmin = session?.user.role === "ADMIN";

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 px-5">
      <div className="w-full space-y-2">
        <h1 className="text-2xl font-semibold">Configuración</h1>
        <p className="text-muted-foreground text-sm">
          Perfil, seguridad y administración de cuentas.
        </p>
      </div>
      <SettingsNav isAdmin={isAdmin} />
      {children}
    </div>
  );
}
