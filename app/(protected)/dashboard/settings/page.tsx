import { getSession } from "@/helpers/getSession";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import UpdateUserForm from "./components/update-user-form";
import ChangePasswordForm from "./components/change-password-form";
import SessionsList from "./components/sessions-list";

export default async function SettingsPage() {
  const sessionData = await getSession();
  const sessions = await auth.api.listSessions({ headers: await headers() });
  const user = sessionData?.user;
  return (
    <div className="flex flex-col items-center gap-10">
      <h1 className="text-2xl font-semibold">Configuración</h1>
      <section className="grid w-7xl max-w-full grid-cols-1 gap-10 md:grid-cols-2">
        <UpdateUserForm
          initialUser={{
            username: user?.username ?? "",
            displayName:
              (user as { displayUsername?: string })?.displayUsername ??
              user?.name ??
              "",
            cargo: user?.cargo ?? null,
          }}
        />
        <ChangePasswordForm />
        <div className="md:col-span-2">
          <SessionsList
            sessions={sessions}
            currentSessionId={sessionData?.session.id ?? ""}
          />
        </div>
      </section>
    </div>
  );
}
