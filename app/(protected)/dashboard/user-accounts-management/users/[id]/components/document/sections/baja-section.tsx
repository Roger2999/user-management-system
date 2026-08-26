import type { AccountRequest } from "@/generated/prisma/client";
import { Row, Cell, CB, formatDate, DATE_PH } from "../primitives";

export function BajaSection({ user }: { user: AccountRequest }) {
  return (
    <Row h={33.9} last>
      <Cell w="w-[26.4%]" className="justify-center gap-1">
        <span className="font-bold">Baja de la entidad</span>
        <CB checked={user.tipoSolicitud === "BAJA"} />
      </Cell>
      <div className="flex w-[40.9%] flex-col border-r-[0.5pt] border-black">
        <div className="border-b-[0.5pt] border-black px-[4pt] py-[1pt] font-bold">
          Motivos
        </div>
        <div className="px-[4pt] py-[1pt]">
          {user.motivosBaja || "\u00A0"}
        </div>
      </div>
      <div className="flex flex-1 flex-col">
        <div className="border-b-[0.5pt] border-black px-[4pt] py-[1pt] font-bold">
          Fecha
        </div>
        <div className="px-[4pt] py-[1pt] text-[9.5pt]">
          {formatDate(user.fechaBaja) || DATE_PH}
        </div>
      </div>
    </Row>
  );
}
