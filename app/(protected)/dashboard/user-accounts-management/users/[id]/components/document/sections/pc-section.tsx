import type { AccountRequest } from "@/generated/prisma/client";
import { Row, Cell } from "../primitives";

export function PcSection({ user }: { user: AccountRequest }) {
  return (
    <>
      <Row h={18.9}>
        <Cell
          w="w-[36.8%]"
          className="flex-col items-start leading-[1.15] font-bold"
        >
          Se autoriza a utilizar el siguiente medio Informático (Nombre PC)
        </Cell>
        <Cell end className="flex-col items-start leading-[1.15] font-bold">
          Se autoriza ademas a autentificarse en los siguientes PC (Nombre PC)
        </Cell>
      </Row>

      <Row h={30.2}>
        <Cell
          w="w-[36.8%]"
          className="flex-col items-stretch justify-between"
        >
          <span className="block w-full border-b border-black">
            {user.pcNombre || "\u00A0"}
          </span>
          <div className="w-full leading-[1.15] font-bold">
            Software autorizado (Además del autorizado por política)
            {user.softwareAutorizado ? (
              <span className="font-normal">: {user.softwareAutorizado}</span>
            ) : null}
          </div>
        </Cell>
        <Cell end className="flex-col items-start">
          <span className="block w-full border-b border-black">
            {user.pcAdicionalNombre || "\u00A0"}
          </span>
        </Cell>
      </Row>
    </>
  );
}
