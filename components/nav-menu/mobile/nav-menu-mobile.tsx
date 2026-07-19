"use client";

import LinkButton from "@/components/link-button";
import SignButton from "@/components/sign-button";
import SignoutButton from "@/components/signout-button";
import { ThemeModeToggle } from "@/components/theme-mode-toggle";
import { Separator } from "@/components/ui/separator";
import { privateRoutes, publicRoutes } from "@/lib/constants";
import { useNavMenuStore } from "@/stores/useNavMenuStore";
import Link from "next/link";
import Image from "next/image";

import { useCallback, useEffect } from "react";
interface Props {
  session: {
    session: {
      id: string;
      createdAt: Date;
      updatedAt: Date;
      userId: string;
      expiresAt: Date;
      token: string;
      ipAddress?: string | null | undefined;
      userAgent?: string | null | undefined;
    };
    user: {
      id: string;
      createdAt: Date;
      updatedAt: Date;
      email: string;
      emailVerified: boolean;
      name: string;
      image?: string | null | undefined;
    };
  } | null;
}
export default function NavMenuMobile({ session }: Props) {
  const { isMenuOpen, setIsMenuOpen } = useNavMenuStore();

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, [setIsMenuOpen]);
  const stopPropagation = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeMenu();
      }
    };
    if (isMenuOpen) {
      document.addEventListener("keydown", handleEsc);
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [closeMenu, isMenuOpen, setIsMenuOpen]);
  if (!isMenuOpen) return null;
  return (
    <div
      className="overlay fixed top-0 z-20 h-full w-full backdrop-blur-xs sm:hidden"
      onClick={closeMenu}
    >
      <aside
        onClick={stopPropagation}
        className={`bg-sidebar absolute top-0 left-0 z-50 flex h-full w-72 max-w-[70%] flex-col gap-5 border px-5 pt-10 transition-all duration-150 sm:hidden`}
      >
        <Link href={"/dashboard"} className="mx-auto">
          <Image
            src={"/une-logo.png"}
            width={20}
            height={20}
            className="h-20 w-20 transition-transform duration-100 ease-in hover:-translate-y-1 hover:scale-125"
            priority
            alt="logo de UNE"
          />
        </Link>
        {/* links */}
        <ul className="space-y-3">
          {session
            ? privateRoutes.map((route, index: number) => (
                <li key={index}>
                  <LinkButton href={route.href} onClick={closeMenu}>
                    {route.name}
                  </LinkButton>
                </li>
              ))
            : publicRoutes.map((route, index: number) => (
                <li key={index}>
                  <LinkButton type="link" href={route.href} onClick={closeMenu}>
                    {route.name}
                  </LinkButton>
                </li>
              ))}
        </ul>

        <Separator />
        {/* buttons */}
        <div className="flex flex-col gap-5">
          {session ? (
            <SignoutButton />
          ) : (
            <>
              <SignButton
                href="/signup"
                className="w-full px-5"
                onClick={closeMenu}
              >
                Registrarse
              </SignButton>
              <SignButton
                href="signin"
                className="w-full px-5"
                onClick={closeMenu}
              >
                Iniciar sesión
              </SignButton>
            </>
          )}
        </div>
        {/* theme switch */}
        <div className="flex w-full items-center justify-center">
          <ThemeModeToggle />
        </div>
      </aside>
    </div>
  );
}
