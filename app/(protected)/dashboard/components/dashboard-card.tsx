"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LockIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  isAdmin?: boolean;
  card: {
    title: string;
    description: string;
    href: string;
  };
  icon: ReactNode;
}

export const DashboardCard = ({ isAdmin, card, icon }: Props) => {
  return (
    <Link
      href={card.href}
      onClick={() => {
        if (!isAdmin) {
          toast.warning("Necesitás permisos de administrador");
        }
      }}
    >
      <Card
        className={cn(
          "hover:bg-card-hover gap-4 pt-0 pb-8 text-center",
          isAdmin && "pt-8",
        )}
      >
        {!isAdmin && (
          <div className="bg-destructive/20 w-full p-4 text-center backdrop-blur-xl">
            Necesita ser admin
            <LockIcon className="absolute top-4 left-25" />
          </div>
        )}
        <CardHeader>
          {icon}
          <CardTitle className="text-xl font-bold">{card.title} </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{card.description}</p>
        </CardContent>
      </Card>
    </Link>
  );
};
