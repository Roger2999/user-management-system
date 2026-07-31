import prisma from "@/lib/prisma";
import SignForm from "./components/sign-form";
import { notFound } from "next/navigation";
import { FileSignature } from "lucide-react";
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
    user.firmadoPorSolicitado &&
    user.firmadoPorRevisado &&
    user.firmadoPorAprobado &&
    user.firmadoPorEjecutado
  )
    return (
      <div className="mt-10 flex w-full flex-col items-center justify-center gap-4">
        <p className="text-2xl">Solicitud de cuenta firmada</p>
        <FileSignature className="text-success size-10 animate-bounce" />
      </div>
    );
  return (
    <div className="flex w-full flex-col items-center justify-center gap-14">
      <h1 className="text-3xl">
        Firmas pendientes de cuenta:{" "}
        <span className="font-bold">{user.nombreApellidos}</span>{" "}
      </h1>
      <SignForm
        id={id}
        initial={{
          requested: user.firmadoPorSolicitado,
          revised: user.firmadoPorRevisado,
          approved: user.firmadoPorAprobado,
          executed: user.firmadoPorEjecutado,
        }}
      />
    </div>
  );
}
