import HamburgerButton from "@/components/hamburger-button";
import LinkButton from "@/components/link-button";
import SignButton from "@/components/sign-button";
import SignoutButton from "@/components/signout-button";
import { ThemeModeToggle } from "@/components/theme-mode-toggle";
import { getSession } from "@/helpers/getSession";
import { PUBLIC_ROUTES, PRIVATE_ROUTES } from "@/lib/constants";
import Link from "next/link";
import Image from "next/image";

export default async function NavMenuDesktop() {
  const session = await getSession();
  return (
    <nav className="border-b-border/90 bg-sidebar flex h-16 w-full items-center justify-between border-b px-5">
      <Link href={"/dashboard"}>
        <Image
          src={"/une-logo.png"}
          width={20}
          height={20}
          className="min-h-12 min-w-16 transition-transform duration-100 ease-in hover:-translate-y-1 hover:scale-110"
          priority
          alt="logo de UNE"
        />
      </Link>

      {/* routes */}
      <ul className="hidden w-full gap-6 pr-10 sm:flex sm:justify-end">
        {session
          ? PRIVATE_ROUTES.map((route) => (
              <li key={route.id}>
                <LinkButton className="flex gap-2" href={route.href}>
                  {route.name}
                  {route.Icon && <route.Icon />}
                </LinkButton>
              </li>
            ))
          : PUBLIC_ROUTES.map((route) => (
              <li key={route.id}>
                <LinkButton href={route.href}>{route.name}</LinkButton>
              </li>
            ))}
      </ul>
      {/* right buttons */}
      <div className="hidden h-full items-center justify-end gap-5 sm:flex">
        {/* sign buttons */}
        {session ? (
          <SignoutButton />
        ) : (
          <>
            <SignButton href="/signup" className="min-w-44 px-5">
              Registrarse
            </SignButton>
            <SignButton href="/signin" className="min-w-44 px-5">
              Iniciar sesión
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
