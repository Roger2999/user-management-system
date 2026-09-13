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
        cargo="Director del área"
        fechaValue={requested?.fecha}
        nombreValue={requested?.nombre}
        cargoValue={requested?.cargo}
      />
      <SignatureBlock
        title="REVISADO POR:"
        cargo="especialista o Técnico de S.Informatica"
        labelsH={21.2}
        fechaValue={revised?.fecha}
        nombreValue={revised?.nombre}
        cargoValue={revised?.cargo}
      />
      <SignatureBlock
        title="APROBADO POR (Director que autoriza el servicio o persona designada por Resolución del Director General de la Entidad)"
        signH={17.8}
        fechaValue={approved?.fecha}
        nombreValue={approved?.nombre}
        cargoValue={approved?.cargo}
      />
      <SignatureBlock
        title="EJECUTADO POR (Especialista que configura la cuenta de usuario y los servicios)"
        labelsH={17.8}
        signH={17.8}
        fechaValue={executed?.fecha}
        nombreValue={executed?.nombre}
        cargoValue={executed?.cargo}
      />
    </>
  );
}