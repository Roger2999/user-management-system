import type { AccountRequestSignature } from "@/generated/prisma/client";
import { AccountRequestStage } from "@/generated/prisma/enums";
import { SignatureBlock } from "../signature-block";
import type { UserWithSignatures } from "../../UserAccountDocument";

function getSignature(
  signatures: AccountRequestSignature[],
  stage: AccountRequestStage,
): AccountRequestSignature | undefined {
  return signatures.find((sig) => sig.stage === stage);
}

export function SignaturesSection({ user }: { user: UserWithSignatures }) {
  const requested = getSignature(user.signatures, AccountRequestStage.requested);
  const revised = getSignature(user.signatures, AccountRequestStage.revised);
  const approved = getSignature(user.signatures, AccountRequestStage.approved);
  const executed = getSignature(user.signatures, AccountRequestStage.executed);

  return (
    <>
      <SignatureBlock
        title="SOLICITADO POR EL DIRECTOR QUE SOLICITA EL SERVICIO. (Este responde por los servicios solicitados)"
        position="Director del área"
        dateValue={requested?.signedAt}
        nameValue={requested?.fullName}
        positionValue={requested?.position}
      />
      <SignatureBlock
        title="REVISADO POR:"
        position="especialista o Técnico de S.Informatica"
        labelsH={21.2}
        dateValue={revised?.signedAt}
        nameValue={revised?.fullName}
        positionValue={revised?.position}
      />
      <SignatureBlock
        title="APROBADO POR (Director que autoriza el servicio o persona designada por Resolución del Director General de la Entidad)"
        signH={17.8}
        dateValue={approved?.signedAt}
        nameValue={approved?.fullName}
        positionValue={approved?.position}
      />
      <SignatureBlock
        title="EJECUTADO POR (Especialista que configura la cuenta de usuario y los servicios)"
        labelsH={17.8}
        signH={17.8}
        dateValue={executed?.signedAt}
        nameValue={executed?.fullName}
        positionValue={executed?.position}
      />
    </>
  );
}