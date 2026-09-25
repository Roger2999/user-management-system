import prisma from "@/lib/prisma";
import SignForm, { SignValues } from "./components/sign-form";
import { notFound } from "next/navigation";
import { getSession } from "@/helpers/getSession";
import { AccountRequestStage } from "@/generated/prisma/enums";
import type { AccountRequestSignature } from "@/generated/prisma/client";
interface Props {
  params: Promise<{ id: string }>;
}

function getSignature(
  signatures: AccountRequestSignature[],
  stage: AccountRequestStage,
): AccountRequestSignature | undefined {
  return signatures.find((sig) => sig.stage === stage);
}

export default async function SignPage({ params }: Props) {
  const { id } = await params;
  const user = await prisma.accountRequest.findUnique({
    where: { id },
    include: { signatures: true },
  });
  if (!user) {
    notFound();
  }

  // Identidad del operador para las etapas que él mismo firma
  // (Revisado/Ejecutado): preview en el formulario, sin texto libre.
  const session = await getSession();
  const currentUser = session?.user
    ? {
        name: session.user.name.trim() || session.user.username || "",
        cargo: session.user.cargo ?? null,
      }
    : undefined;

  const initial: SignValues = {
    requested: Boolean(getSignature(user.signatures, "requested")),
    requestedNombre: getSignature(user.signatures, "requested")?.nombre ?? "",
    requestedCargo: getSignature(user.signatures, "requested")?.cargo ?? "",
    revised: Boolean(getSignature(user.signatures, "revised")),
    revisedNombre: getSignature(user.signatures, "revised")?.nombre ?? "",
    revisedCargo: getSignature(user.signatures, "revised")?.cargo ?? "",
    approved: Boolean(getSignature(user.signatures, "approved")),
    approvedNombre: getSignature(user.signatures, "approved")?.nombre ?? "",
    approvedCargo: getSignature(user.signatures, "approved")?.cargo ?? "",
    executed: Boolean(getSignature(user.signatures, "executed")),
    executedNombre: getSignature(user.signatures, "executed")?.nombre ?? "",
    executedCargo: getSignature(user.signatures, "executed")?.cargo ?? "",
  };

  return (
    <div className="flex w-full flex-col items-center justify-center gap-14">
      <h1 className="text-3xl">
        Firmas pendientes de cuenta:{" "}
        <span className="font-bold">{user.nombreApellidos}</span>{" "}
      </h1>
      <SignForm id={id} initial={initial} currentUser={currentUser} />
    </div>
  );
}
