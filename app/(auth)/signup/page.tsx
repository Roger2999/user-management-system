import SignupForm from "./components/signup-form";

export default function Signup() {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-5">
      <h1>Sign up</h1>
      <SignupForm />
    </div>
  );
}
