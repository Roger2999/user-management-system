import SignupForm from "./components/signup-form";

export default function Signup() {
  return (
    <div className="flex flex-col items-center gap-6">
      <h1 className="text-2xl">Registrarse</h1>
      <SignupForm />
    </div>
  );
}
