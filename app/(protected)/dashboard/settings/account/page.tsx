import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getSession } from "@/lib/getSession";
import AccountSummary from "./components/account-summary";
import ChangePasswordForm from "./components/change-password-form";
import SessionsList from "./components/sessions-list";
import UpdateUserForm from "./components/update-user-form";
import SectionHeading from "../components/section-heading";

export default async function AccountSettingsPage() {
  const sessionData = await getSession();
  const user = sessionData?.user;

  const sessions = await auth.api.listSessions({ headers: await headers() });

  return (
    <div className="flex w-full flex-col gap-8">
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
    </div>
  );
}
