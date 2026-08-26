import type { AccountRequest } from "@/generated/prisma/client";
import { Row, Cell, CB } from "../primitives";
import { Banner } from "../data-fields";

export function ScheduleSection({ user }: { user: AccountRequest }) {
  return (
    <>
      <Banner>DÍAS Y HORAS DE USO DE LA CUENTA:</Banner>

      <Row h={16.5}>
        <Cell end className="gap-[10pt]">
          <span className="flex items-center gap-1">
            <span>Lunes a Viernes</span>
            <CB checked={!user.horarioExtralaboral && !user.horario24Horas} />
          </span>
          <span className="flex items-center gap-1">
            <span>Horario Extralaboral</span>
            <CB checked={user.horarioExtralaboral} />
          </span>
          {!user.horario24Horas && (
            <span className="flex items-center gap-1">
              <span>de</span>
              <span className="min-w-[40pt] border-b border-black text-center">
                {user.extraDesde || ""}
              </span>
              <span>hrs. a</span>
              <span className="min-w-[40pt] border-b border-black text-center">
                {user.extraHasta || ""}
              </span>
              <span>hrs.</span>
            </span>
          )}
        </Cell>
      </Row>

      <Row h={25.1}>
        <Cell w="w-[42.4%]" className="flex-col items-start">
          <span className="flex w-full items-center gap-1">
            <span>No laborables: Sábado de</span>
            <span className="min-w-10 border-b border-black text-center">
              {user.sabadoDesde || ""}
            </span>
            <span>hrs. a</span>
            <span className="min-w-10 border-b border-black text-center">
              {user.sabadoHasta || ""}
            </span>
            <span>hrs.</span>
          </span>
          <span className="flex w-full items-center gap-1">
            <span>Domingo de</span>
            <span className="min-w-10 border-b border-black text-center">
              {user.domingoDesde || ""}
            </span>
            <span>hrs. a</span>
            <span className="min-w-10 border-b border-black text-center">
              {user.domingoHasta || ""}
            </span>
            <span>hrs.</span>
          </span>
        </Cell>
        <Cell end className="justify-center gap-1">
          <span>24 horas</span>
          <CB checked={user.horario24Horas} />
        </Cell>
      </Row>
    </>
  );
}
