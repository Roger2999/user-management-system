import type { AccountRequest } from "@/lib/db";
import { Row, Cell, CB, formatDate } from "../primitives";

export function HeaderSection({ user }: { user: AccountRequest }) {
  return (
    <>
      <Row h={9.7}>
        <Cell w="w-[21.3%]" className="font-bold">
          OM-PP 0001
        </Cell>
        <Cell end className="justify-center font-bold">
          SOLICITUD DE CUENTA DE USUARIO Y SERVICIOS DE RED
        </Cell>
      </Row>

      <Row h={9.7}>
        <Cell w="w-[34.3%]">
          <span className="shrink-0 font-bold">Folio Único:</span>
          <span className="ml-[4pt]">{user.folio || "\u00A0"}</span>
        </Cell>
        <Cell end>
          <span className="shrink-0 font-bold">Fecha de Solicitud:</span>
          <span className="ml-[4pt]">
            {formatDate(user.createdAt) || "\u00A0"}
          </span>
        </Cell>
      </Row>

      <Row h={12.7}>
        <Cell w="w-[25.3%]" className="font-bold">
          TIPO DE GESTIÓN
        </Cell>
        <Cell w="w-[24.9%]" className="justify-center gap-1">
          <span className="font-bold">ALTA</span>
          <CB checked={user.requestType === "NEW"} />
        </Cell>
        <Cell w="w-[24.9%]" className="justify-center gap-1">
          <span className="font-bold">ACTUALIZACIÓN</span>
          <CB checked={user.requestType === "UPDATE"} />
        </Cell>
        <Cell end className="justify-center gap-1">
          <span className="font-bold">MODIFICACIÓN</span>
          <CB checked={false} />
        </Cell>
      </Row>
    </>
  );
}
