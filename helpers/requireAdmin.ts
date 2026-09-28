import { getSession } from "./getSession";
import { redirect } from "next/navigation";

/**
 * Authorization gate for administrative actions and routes.
 * No session -> /signin. Session without the ADMIN role -> /dashboard.
 */
export async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    redirect("/signin");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }
}
