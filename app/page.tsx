import { getSession } from "@/helpers/getSession";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getSession();
  //si no hay session redirect
  if (!session) {
    redirect("/signin");
  }
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      Home
    </div>
  );
}
