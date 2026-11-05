import { getSession } from "@/lib/getSession";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Separator } from "@/components/ui/separator";
import UpdateUserForm from "./components/update-user-form";
import ChangePasswordForm from "./components/change-password-form";
import CreateUserForm from "./components/create-user-form";
import ResetUserPasswordForm from "./components/reset-user-password-form";
import AccountSummary from "./components/account-summary";
import SectionHeading from "./components/section-heading";
import SessionsList from "./components/sessions-list";
import AdDirectorySyncCard from "./components/ad-directory-sync-card";
import { loadAdConfig } from "@/modules/ad/config";

export default async function SettingsPage() {
  const sessionData = await getSession();
  const user = sessionData?.user;
  const isAdmin = user?.role === "ADMIN";

  // Una configuración mal escrita (protocolo distinto a LDAPS) lanza: la
  // pantalla no debe caer por eso, sólo mostrar el botón deshabilitado.
  const adConfigured = (() => {
    try {
      return loadAdConfig(process.env) !== null;
    } catch {
      return false;
    }
  })();

  const [sessions, users] = await Promise.all([
    auth.api.listSessions({ headers: await headers() }),
    isAdmin
      ? prisma.user.findMany({
          select: { id: true, username: true, fullName: true },
          orderBy: { fullName: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const userOptions = users.map((option) => ({
    value: option.id,
    label: option.username
      ? `${option.fullName} (${option.username})`
      : option.fullName,
  }));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-10 px-5">
      <div className="w-full space-y-2">
        <h1 className="text-2xl font-semibold">Configuración</h1>
        <p className="text-muted-foreground text-sm">
          Perfil, seguridad y administración de cuentas.
        </p>
      </div>

      <AccountSummary
        fullName={user?.fullName ?? user?.name ?? ""}
        username={user?.username}
        email={user?.email ?? ""}
        role={user?.role ?? "USER"}
        position={user?.position}
      />

      <section
        aria-labelledby="mi-cuenta"
        className="flex w-full flex-col gap-6"
      >
        <SectionHeading
          id="mi-cuenta"
          title="Mi cuenta"
          description="Tus datos de perfil, la contraseña y las sesiones abiertas."
        />
        <div className="grid gap-6 md:grid-cols-2">
          <UpdateUserForm
            initialUser={{
              username: user?.username ?? "",
              displayName:
                (user as { displayUsername?: string })?.displayUsername ??
                user?.name ??
                "",
              position: user?.position ?? null,
            }}
          />
          <ChangePasswordForm />
        </div>
        <SessionsList
          sessions={sessions}
          currentSessionId={sessionData?.session.id ?? ""}
        />
      </section>

      {isAdmin && (
        <>
          <Separator />
          <section
            aria-labelledby="administracion"
            className="flex w-full flex-col gap-6"
          >
            <SectionHeading
              id="administracion"
              title="Administración"
              description="Alta de usuarios y restablecimiento de contraseñas."
            />
            <CreateUserForm />
            <ResetUserPasswordForm users={userOptions} />
            <div className="md:col-span-2">
              <AdDirectorySyncCard adConfigured={adConfigured} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
