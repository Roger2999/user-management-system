"use client";

import { useNavMenuStore } from "@/stores/useNavMenuStore";
import { Menu } from "lucide-react";
import { Button } from "./ui/button";

export default function HamburgerButton() {
  const { isMenuOpen, setIsMenuOpen } = useNavMenuStore();

  return (
    <Button
      variant={"outline"}
      className="relative z-30 ml-5 sm:hidden"
      onClick={() => setIsMenuOpen(!isMenuOpen)}
    >
      <Menu />
    </Button>
  );
}
