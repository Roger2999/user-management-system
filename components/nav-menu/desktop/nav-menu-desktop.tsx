import HamburgerButton from "@/components/hamburger-button";
import LinkButton from "@/components/link-button";
import SignButton from "@/components/sign-button";
import SignoutButton from "@/components/signout-button";
import { ThemeModeToggle } from "@/components/theme-mode-toggle";
import { getSession } from "@/helpers/getSession";
import { publicRoutes } from "@/lib/constants";
import { privateRoutes } from "@/lib/constants";
import Link from "next/link";

export default async function NavMenuDesktop() {
  const session = await getSession();
  return (
    <nav className="border-b-border/90 bg-menu flex h-16 w-full items-center justify-between border-b px-5">
      {session && (
        <Link
          href={"/dashboard"}
          className="text-xl transition-all duration-100 ease-in hover:text-2xl"
        >
          Dashboard
        </Link>
      )}
      {/* routes */}
      <ul className="hidden gap-6 sm:flex">
        {session
          ? privateRoutes.map(
              (route: {
                name: string;
                href: string;
                current: boolean;
                id: string;
              }) => (
                <li key={route.id}>
                  <LinkButton type="link" href={route.href}>
                    {route.name}
                  </LinkButton>
                </li>
              ),
            )
          : publicRoutes.map(
              (route: {
                name: string;
                href: string;
                current: boolean;
                id: string;
              }) => (
                <li key={route.id}>
                  <LinkButton type="link" href={route.href}>
                    {route.name}
                  </LinkButton>
                </li>
              ),
            )}
      </ul>
      {/* right buttons */}
      <div className="hidden h-full items-center justify-center gap-5 pr-10 sm:flex">
        {/* sign buttons */}
        {session ? (
          <SignoutButton />
        ) : (
          <>
            <SignButton href="/signup" className="px-5">
              Signup
            </SignButton>
            <SignButton href="/signin" className="px-5">
              Signin
            </SignButton>
          </>
        )}
        {/* theme button */}
        <ThemeModeToggle />
      </div>
      {/* hamburger button */}
      <HamburgerButton />
    </nav>
  );
}
