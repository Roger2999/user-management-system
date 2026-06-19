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
  type,
  ...props
}: Props) {
  const baseStyles = "text-md p-1";
  const pathname = usePathname();
  const isActive = pathname === props.href;
  return (
    <Link
      href={"/"}
      {...props}
      type={type}
      className={cn(
        baseStyles,
        className,
        type === "neutral" &&
          "rounded-md border border-black/20 bg-gray-400 p-1 hover:text-gray-800",
        type === "destructive" &&
          "rounded-md border border-black/20 bg-gray-400 p-1 hover:text-gray-800",
        type === "success" &&
          "rounded-md border border-black/20 bg-gray-400 p-1 hover:text-gray-800",
        type === "link" &&
          "transition-all duration-100 hover:border-b-4 hover:border-b-gray-700 hover:text-blue-600",
        isActive && "border-b-2 border-gray-400",
      )}
    >
      {children ? children : "label"}
    </Link>
  );
}
