import prisma from "@/lib/prisma";
import SignForm from "./components/sign-form";
import type { SignValues } from "./components/sign-form";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  params: Promise<{ id: string }>;
}
export default async function SignPage({ params }: Props) {
  const { id } = await params;
  const user = await prisma.accountRequest.findUnique({
    where: { id },
  });
  if (!user) {
    notFound();
  }
  if (
    user?.firmadoPorSolicitado &&
    user?.firmadoPorRevisado &&
    user?.firmadoPorAprobado &&
    user?.firmadoPorEjecutado
  )
    return (
      <div className="flex w-full min-h-full justify-center">
        <p className="text-2xl">Solicitud firmada ✅</p>
      </div>
    );
  return (
    <div className="flex flex-col items-center justify-center w-full gap-10">
      <h1 className="text-3xl">
        Firmas pendientes de cuenta:{" "}
        <span className="font-bold">{user.nombreApellidos}</span>{" "}
      </h1>
        <Suspense fallback={
          <div className="w-full max-w-md flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 shrink-0" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        }>
          <SignForm
            id={id}
            initial={{
              requested: user.firmadoPorSolicitado,
              revised: user.firmadoPorRevisado,
              approved: user.firmadoPorAprobado,
              executed: user.firmadoPorEjecutado,
            }}
          />
        </Suspense>
    </div>
  );
}
