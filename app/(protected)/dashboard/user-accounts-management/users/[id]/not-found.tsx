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
    <div className="flex min-h-layout-content items-center justify-center">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-destructive text-4xl font-bold">
            404
          </CardTitle>
          <CardDescription className="text-lg">
            Usuario no encontrado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            El usuario que buscas no existe o ha sido eliminado.
          </p>
        </CardContent>
        <CardFooter className="justify-center">
          <Button asChild>
            <Link href="/dashboard/users">Volver</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
