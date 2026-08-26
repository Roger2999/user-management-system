import type { AccountRequest } from "@/generated/prisma/client";
import { Row, Cell, CB, formatDate } from "../primitives";
import { Banner } from "../data-fields";

export function AccountTypeSection({ user }: { user: AccountRequest }) {
  return (
    <>
      <Banner>TIPO DE CUENTA</Banner>

      <Row h={9.7}>
        <Cell end className="gap-2">
          <span className="flex items-center gap-1">
            <span>Permanente</span>
            <CB checked={user.tipoCuenta === "PERMANENTE"} />
          </span>
          <span>
            Valida por 2 años a partir de su creación o actualización.
          </span>
        </Cell>
      </Row>

      <Row h={18.9}>
        <Cell end className="items-start pt-[2pt]">
          <span className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span>Temporal</span>
              <CB checked={user.tipoCuenta === "TEMPORAL"} />
            </span>
            <span className="flex items-center gap-[4pt]">
              <span>Fecha de expiración</span>
              <span className="min-w-[70pt] border-b border-black text-center">
                {formatDate(user.fechaExpiracion) || "____/______/202___"}
              </span>
            </span>
          </span>
        </Cell>
      </Row>
    </>
  );
}
