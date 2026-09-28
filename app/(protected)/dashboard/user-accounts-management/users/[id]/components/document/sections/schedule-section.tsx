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
            <CB checked={!user.overtimeSchedule && !user.aroundTheClockSchedule} />
          </span>
          <span className="flex items-center gap-1">
            <span>Horario Extralaboral</span>
            <CB checked={user.overtimeSchedule} />
          </span>
          {!user.aroundTheClockSchedule && (
            <span className="flex items-center gap-1">
              <span>de</span>
              <span className="min-w-[40pt] border-b border-black text-center">
                {user.overtimeFrom || ""}
              </span>
              <span>hrs. a</span>
              <span className="min-w-[40pt] border-b border-black text-center">
                {user.overtimeTo || ""}
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
              {user.saturdayFrom || ""}
            </span>
            <span>hrs. a</span>
            <span className="min-w-10 border-b border-black text-center">
              {user.saturdayTo || ""}
            </span>
            <span>hrs.</span>
          </span>
          <span className="flex w-full items-center gap-1">
            <span>Domingo de</span>
            <span className="min-w-10 border-b border-black text-center">
              {user.sundayFrom || ""}
            </span>
            <span>hrs. a</span>
            <span className="min-w-10 border-b border-black text-center">
              {user.sundayTo || ""}
            </span>
            <span>hrs.</span>
          </span>
        </Cell>
        <Cell end className="justify-center gap-1">
          <span>24 horas</span>
          <CB checked={user.aroundTheClockSchedule} />
        </Cell>
      </Row>
    </>
  );
}
