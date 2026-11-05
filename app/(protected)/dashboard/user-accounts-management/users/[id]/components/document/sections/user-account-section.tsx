import type { AccountRequest } from "@/lib/db";
import { Row, Cell, CB } from "../primitives";

export function UserAccountSection({ user }: { user: AccountRequest }) {
  return (
    <>
      <Row h={10.5}>
        <Cell w="w-[30%]" className="font-bold">
          Cuenta de Usuario:
        </Cell>
        <Cell w="w-[40%]" className="font-bold">
          Actividad que realiza:
        </Cell>
        <Cell end className="justify-between font-bold">
          <span>Administrador de Sistema</span>
          <span className="flex shrink-0 items-center gap-1">
            <span>Si</span>
            <CB checked={user.administradorSistema} />
            <span>No</span>
            <CB checked={!user.administradorSistema} />
          </span>
        </Cell>
      </Row>

      <Row h={19}>
        <Cell w="w-[30%]">
          <div className="line-clamp-2 w-full break-words">
            {user.cuentaUsuario || "\u00A0"}
          </div>
        </Cell>
        <Cell w="w-[40%]">
          <div className="line-clamp-2 w-full break-words">
            {user.actividadRealiza || "\u00A0"}
          </div>
        </Cell>
        <Cell end />
      </Row>
    </>
  );
}
