import { getSession } from "@/helpers/getSession";

export default async function Dashboard() {
  const session = await getSession();
  const username = session?.user.name;
  return <div>Bienvenido a {username} Dashboard</div>;
}
