import type { AccountRequest } from "@/generated/prisma/client";
import { Row, Cell, CB } from "../primitives";
import { Banner } from "../data-fields";

export function ApnSection({ user }: { user: AccountRequest }) {
  return (
    <>
      <Banner>ACCESO POR APN</Banner>

      <Row h={14.4}>
        <Cell end className="gap-[10pt]">
          <span className="flex items-center gap-1">
            <span>Correo nacional</span>
            <CB checked={user.apnCorreoNacional} />
          </span>
          <span className="flex items-center gap-1">
            <span>Correo Internacional</span>
            <CB checked={user.apnCorreoInternacional} />
          </span>
          <span className="flex items-center gap-1">
            <span>Internet</span>
            <CB checked={user.apnInternet} />
          </span>
          <span className="flex items-center gap-1">
            <span>Numero celular:</span>
            <span className="min-w-[50pt]">{user.telefonoCelular || ""}</span>
          </span>
        </Cell>
      </Row>
    </>
  );
}
