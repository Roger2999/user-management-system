import UpdateUserForm from "./components/update-user-form";

export default function SettingsPage() {
  return (
    <div className="flex flex-col items-center gap-10">
      <h1 className="text-2xl font-semibold">Configuración</h1>
      <UpdateUserForm />
    </div>
  );
}
