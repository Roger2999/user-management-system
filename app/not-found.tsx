import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-destructive text-4xl font-bold">
            404
          </CardTitle>
          <CardDescription className="text-lg">
            Pagina no encontrada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            La pagina que buscas no existe o ha sido movida.
          </p>
        </CardContent>
        <CardFooter className="justify-center">
          <Button asChild>
            <Link href="/dashboard">Volver al dashboard</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
