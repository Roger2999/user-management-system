import type { AccountRequest } from "@/generated/prisma/client";
import { SignatureBlock } from "../signature-block";

export function SignaturesSection({ user }: { user: AccountRequest }) {
  return (
    <>
      <SignatureBlock
        title="SOLICITADO POR EL DIRECTOR QUE SOLICITA EL SERVICIO. (Este responde por los servicios solicitados)"
        cargo="Director del área"
        fechaValue={user.solicitadoFecha}
      />
      <SignatureBlock
        title="REVISADO POR:"
        cargo="especialista o Técnico de S.Informatica"
        labelsH={21.2}
        fechaValue={user.revisadoFecha}
      />
      <SignatureBlock
        title="APROBADO POR (Director que autoriza el servicio o persona designada por Resolución del Director General de la Entidad)"
        signH={17.8}
        fechaValue={user.aprobadoFecha}
      />
      <SignatureBlock
        title="EJECUTADO POR (Especialista que configura la cuenta de usuario y los servicios)"
        labelsH={17.8}
        signH={17.8}
        fechaValue={user.ejecutadoFecha}
      />
    </>
  );
}
