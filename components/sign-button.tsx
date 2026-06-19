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
  const baseStyles = "bg-white/20 border rounded-md p-1 border-black/20";

  return (
    <Link {...props} href={href} className={cn(baseStyles, className)}>
      {children ? children : "label"}
    </Link>
  );
}
