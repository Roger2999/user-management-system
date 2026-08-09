"use client";
import { cn } from "@/lib/utils";

import Link from "next/link";
import { usePathname } from "next/navigation";
interface Props extends React.ComponentProps<"a"> {
  type?: "neutral" | "destructive" | "success" | "link";
  className?: string;
}
export default function LinkButton({
  className,
  children,
  type = "neutral",
  href = "/",
  ...props
}: Props) {
  const baseStyles = "text-md p-1 transition-colors";
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      {...props}
      className={cn(
        baseStyles,
        className,
        type === "neutral" && "text-foreground hover:bg-muted",
        type === "destructive" && "text-destructive hover:bg-destructive/10",
        type === "success" &&
          "text-foreground bg-success/40 hover:bg-success/60",
        type === "link" && "text-success hover:bg-success/10",
        isActive && "border-primary border-b-2",
      )}
    >
      {children ?? "Link"}
    </Link>
  );
}
