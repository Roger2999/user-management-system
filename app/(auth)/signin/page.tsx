import SigninForm from "./components/signin-form";

export default function Signin() {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-5">
      <h1>Sign in</h1>
      <SigninForm />
    </div>
  );
}
