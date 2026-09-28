import type { AccountRequest } from "@/generated/prisma/client";
import { Row, Cell, CB } from "../primitives";
import { DataField } from "../data-fields";

export function GestionSection({ user }: { user: AccountRequest }) {
  return (
    <>
      <DataField label="Nombre y apellidos:" value={user.fullName} />
      <DataField label="Teléfono/Extensión:" value={user.phoneExtension} />

      <Row h={12.7}>
        <Cell w="w-[37.7%]">
          <span className="shrink-0 font-bold">Cargo</span>
          <span className="ml-[4pt] flex-1">
            {user.currentPosition || "\u00A0"}
          </span>
        </Cell>
        <Cell end>
          <span className="shrink-0 font-bold">Departamento/Área</span>
          <span className="ml-[4pt] flex-1">
            {user.department || "\u00A0"}
          </span>
        </Cell>
      </Row>

      <Row h={12.7}>
        <Cell end className="font-bold">
          Tipo de personal:
        </Cell>
      </Row>

      <Row h={9.7}>
        <Cell end className="gap-[14pt]">
          <span className="flex items-center gap-1">
            <span className="font-bold">Directivo</span>
            <CB checked={user.staffType === "EXECUTIVE"} />
          </span>
          <span className="flex items-center gap-1">
            <span className="font-bold">
              Especialista principal (J. Grupo)
            </span>
            <CB checked={user.staffType === "SENIOR_SPECIALIST"} />
          </span>
          <span className="flex items-center gap-1">
            <span className="font-bold">Técnico</span>
            <CB checked={user.staffType === "TECHNICIAN"} />
          </span>
          <span className="flex items-center gap-1">
            <span className="font-bold">Otro</span>
            <CB checked={user.staffType === "OTHER"} />
          </span>
        </Cell>
      </Row>

      <DataField
        label="Identificador de cuenta de usuario:"
        value={user.username}
      />
    </>
  );
}
