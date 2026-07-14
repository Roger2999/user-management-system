"use client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ReactNode } from "react";

interface Props extends React.ComponentProps<"a"> {
  children: ReactNode;
  href: string;
}

export default function SignButton({
  children,
  className,
  href,
  ...props
}: Props) {
  const baseStyles =
    "border border-border bg-background rounded-md p-1 hover:bg-muted transition-colors";

  return (
    <Link {...props} href={href} className={cn(baseStyles, className)}>
      {children ? children : "etiqueta"}
    </Link>
  );
}
