import type { AccountRequest } from "@/generated/prisma/client";
import { Row, Cell, CB } from "../primitives";
import { DataField } from "../data-fields";

export function GestionSection({ user }: { user: AccountRequest }) {
  return (
    <>
      <DataField label="Nombre y apellidos:" value={user.nombreApellidos} />
      <DataField label="Teléfono/Extensión:" value={user.telefonoExtension} />

      <Row h={12.7}>
        <Cell w="w-[37.7%]">
          <span className="shrink-0 font-bold">Cargo</span>
          <span className="ml-[4pt] flex-1">
            {user.cargoOcupa || "\u00A0"}
          </span>
        </Cell>
        <Cell end>
          <span className="shrink-0 font-bold">Departamento/Área</span>
          <span className="ml-[4pt] flex-1">
            {user.departamentoArea || "\u00A0"}
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
            <CB checked={user.tipoPersonal === "DIRECTIVO"} />
          </span>
          <span className="flex items-center gap-1">
            <span className="font-bold">
              Especialista principal (J. Grupo)
            </span>
            <CB checked={user.tipoPersonal === "ESPECIALISTA_PRINCIPAL"} />
          </span>
          <span className="flex items-center gap-1">
            <span className="font-bold">Técnico</span>
            <CB checked={user.tipoPersonal === "TECNICO"} />
          </span>
          <span className="flex items-center gap-1">
            <span className="font-bold">Otro</span>
            <CB checked={user.tipoPersonal === "OTRO"} />
          </span>
        </Cell>
      </Row>

      <DataField
        label="Identificador de cuenta de usuario:"
        value={user.identificadorCuentaUsuario}
      />
    </>
  );
}
