import { getSession } from "@/helpers/getSession";
import NavMenuMobile from "./nav-menu-mobile";

export default async function NavMenuMobileWrapper() {
  const session = await getSession();
  return <NavMenuMobile session={session} />;
}
