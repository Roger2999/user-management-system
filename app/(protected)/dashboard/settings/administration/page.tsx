import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { loadAdConfig } from "@/modules/ad/config";
import AdDirectorySyncCard from "./components/ad-directory-sync-card";
import CreateUserForm from "./components/create-user-form";
import ResetUserPasswordForm from "./components/reset-user-password-form";
import SectionHeading from "../components/section-heading";

export default async function AdministrationSettingsPage() {
  // La guarda del layout ya redirigió, pero el fetch del directorio no debe
  // depender de eso: si el rol cambió con la página montada, esta línea corta.
  await requireAdmin();

  // Una configuración mal escrita (protocolo distinto a LDAPS) lanza: la
  // pantalla no debe caer por eso, sólo mostrar el botón deshabilitado.
  const adConfigured = (() => {
    try {
      return loadAdConfig(process.env) !== null;
    } catch {
      return false;
    }
  })();

  const users = await prisma.user.findMany({
    select: { id: true, username: true, fullName: true },
    orderBy: { fullName: "asc" },
  });

  const userOptions = users.map((option) => ({
    value: option.id,
    label: option.username
      ? `${option.fullName} (${option.username})`
      : option.fullName,
  }));

  return (
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
      <AdDirectorySyncCard adConfigured={adConfigured} />
    </section>
  );
}
