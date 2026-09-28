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

  // Operator identity for the stages they sign themselves
  // (Revised/Executed): preview in the form, no free text.
  const session = await getSession();
  const currentUser = session?.user
    ? {
        name: session.user.name.trim() || session.user.username || "",
        position: session.user.position ?? null,
      }
    : undefined;

  const initial: SignValues = {
    requested: Boolean(getSignature(user.signatures, "requested")),
    requestedName: getSignature(user.signatures, "requested")?.fullName ?? "",
    requestedPosition:
      getSignature(user.signatures, "requested")?.position ?? "",
    revised: Boolean(getSignature(user.signatures, "revised")),
    revisedName: getSignature(user.signatures, "revised")?.fullName ?? "",
    revisedPosition: getSignature(user.signatures, "revised")?.position ?? "",
    approved: Boolean(getSignature(user.signatures, "approved")),
    approvedName: getSignature(user.signatures, "approved")?.fullName ?? "",
    approvedPosition:
      getSignature(user.signatures, "approved")?.position ?? "",
    executed: Boolean(getSignature(user.signatures, "executed")),
    executedName: getSignature(user.signatures, "executed")?.fullName ?? "",
    executedPosition:
      getSignature(user.signatures, "executed")?.position ?? "",
  };

  return (
    <div className="flex w-full flex-col items-center justify-center gap-14">
      <h1 className="text-3xl">
        Firmas pendientes de cuenta:{" "}
        <span className="font-bold">{user.fullName}</span>{" "}
      </h1>
      <SignForm id={id} initial={initial} currentUser={currentUser} />
    </div>
  );
}
