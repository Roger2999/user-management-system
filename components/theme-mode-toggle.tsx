"use client";

import {
  Moon,
  Sun,
  ArrowBigDownDash,
  ArrowBigUpDash,
  SunMoon,
} from "lucide-react";
import { useTheme } from "next-themes";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { THEMES } from "@/lib/constants";

export function ThemeModeToggle() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const handleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <DropdownMenu onOpenChange={handleMenu}>
      <DropdownMenuTrigger className="border-border/50 flex w-fit cursor-pointer items-center justify-center gap-3 rounded-2xl border px-4 py-1">
        {theme === "light" ? (
          <Sun className="h-[1.2rem] w-[1.2rem]" />
        ) : (
          <Moon className="h-[1.2rem] w-[1.2rem]" />
        )}

        {isOpen ? <ArrowBigUpDash /> : <ArrowBigDownDash />}

        <span className="sr-only">Cambiar tema</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-fit" sideOffset={8} align="center">
        {THEMES.map((theme) => (
          <DropdownMenuItem
            key={theme.name}
            onClick={() => setTheme(theme.name)}
            className="flex justify-around"
          >
            {theme.label}
            {theme.name === "light" ? (
              <Sun className="h-[1.2rem] w-[1.2rem]" />
            ) : theme.name === "dark" ? (
              <Moon className="h-[1.2rem] w-[1.2rem]" />
            ) : (
              <SunMoon className="h-[1.2rem] w-[1.2rem]" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
