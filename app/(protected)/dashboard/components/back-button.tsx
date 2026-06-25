"use client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowBigLeftDash } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { ComponentProps } from "react";
interface Props extends ComponentProps<"button"> {
  className?: string;
}
export default function BackButton({ className, ...props }: Props) {
  const router = useRouter();
  const pathName = usePathname();
  if (pathName === "/dashboard") return null;
  return (
    <Button
      onClick={() => router.back()}
      {...props}
      className={cn("flex justify-around items-center w-fit px-5", className)}
    >
      <ArrowBigLeftDash />
      Atras
    </Button>
  );
}
