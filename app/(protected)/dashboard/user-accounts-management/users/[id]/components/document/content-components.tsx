import type { ReactNode } from "react";
import { Row, Cell } from "./primitives";

export function ServiceTitle({
  title,
  lines = 1,
}: {
  title: string[];
  lines?: number;
}) {
  return (
    <Row h={9.7 * lines}>
      <Cell w="w-[35.2%]" className="flex-col items-start">
        {title.map((t) => (
          <div key={t} className="w-full leading-[1.15] font-bold">
            {t}
          </div>
        ))}
      </Cell>
      <Cell end className="flex-col items-start font-bold">
        MOTIVO DE LA SOLICITUD
      </Cell>
    </Row>
  );
}

export function ContentRow({ h, lines }: { h: number; lines: ReactNode[] }) {
  return (
    <Row h={h}>
      <Cell w="w-[35.2%]" className="flex-col items-start">
        {lines.map((l, i) => (
          <div key={i} className="w-full">
            {l}
          </div>
        ))}
      </Cell>
      <Cell end />
    </Row>
  );
}
