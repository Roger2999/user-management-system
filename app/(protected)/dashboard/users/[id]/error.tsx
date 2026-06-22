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

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-4xl font-bold text-destructive">
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
            <a href="/dashboard/users">Volver a la lista</a>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
