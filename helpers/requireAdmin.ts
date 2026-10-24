import { getSession } from "./getSession";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    redirect("/signin");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }
}
