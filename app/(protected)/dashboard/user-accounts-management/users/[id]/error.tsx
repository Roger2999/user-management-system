"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-layout-content items-center justify-center">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-destructive text-4xl font-bold">
            Error
          </CardTitle>
          <CardDescription className="text-lg">
            Algo sali&oacute; mal al cargar el usuario
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {error.message ||
              "Ocurri&oacute; un error inesperado. Intenta de nuevo."}
          </p>
        </CardContent>
        <CardFooter className="justify-center gap-4">
          <Button onClick={reset}>Reintentar</Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/users">Volver</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
