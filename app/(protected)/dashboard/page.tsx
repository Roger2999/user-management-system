import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function Dashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const username = session?.user.name;
  return <div>Bienvenido a {username} Dashboard</div>;
}
