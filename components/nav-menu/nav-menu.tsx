import NavMenuDesktop from "./desktop/nav-menu-desktop";
import NavMenuMobileWrapper from "./mobile/nav-menu-mobile-wrapper";

export default function NavMenu() {
  return (
    <>
      <div>
        <NavMenuDesktop />
        <NavMenuMobileWrapper />
      </div>
    </>
  );
}
