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
          Se autoriza a utilizar el siguiente medio informático (Nombre PC)
        </Cell>
        <Cell end className="flex-col items-start leading-[1.15] font-bold">
          Se autoriza además a autenticarse en los siguientes PC (Nombre PC)
        </Cell>
      </Row>

      <Row h={12.7}>
        <Cell w="w-[36.8%]" className="flex-col items-stretch justify-center">
          <span className="block w-full">{user.pcName || "\u00A0"}</span>
        </Cell>
        <Cell end className="flex-col items-stretch justify-center">
          <span className="block w-full">{user.additionalPcName || "\u00A0"}</span>
        </Cell>
      </Row>

      <Row h={9.7}>
        <Cell w="w-[36.8%]" className="font-bold">
          No. Inventario
        </Cell>
        <Cell end className="font-bold">
          No. Inventario
        </Cell>
      </Row>

      <Row h={12.7}>
        <Cell w="w-[36.8%]" className="flex-col items-stretch justify-center">
          <span className="block w-full">{user.pcAssetTag || "\u00A0"}</span>
        </Cell>
        <Cell end className="flex-col items-stretch justify-center">
          <span className="block w-full">
            {user.additionalPcAssetTag || "\u00A0"}
          </span>
        </Cell>
      </Row>

      <Row h={13.5}>
        <Cell end className="items-start py-[2pt]">
          <span className="shrink-0 font-bold">
            Software autorizado (Además del autorizado por política):
          </span>
          <span className="ml-[4pt] flex-1">
            {user.authorizedSoftware || "\u00A0"}
          </span>
        </Cell>
      </Row>
    </>
  );
}
