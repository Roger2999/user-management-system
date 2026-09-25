import { getSession } from "./getSession";
import { redirect } from "next/navigation";

/**
 * Gate de autorización para acciones y rutas de administración.
 * Sin sesión -> /signin. Sesión sin rol ADMIN -> /dashboard.
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