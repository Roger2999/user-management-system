import { getSession } from "@/helpers/getSession";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getSession();
  //si no hay session redirect
  if (!session) {
    redirect("/signin");
  }
  return <>Home</>;
}
