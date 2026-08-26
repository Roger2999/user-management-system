import { Row, Cell, formatDate } from "./primitives";
import { DATE_PH } from "./primitives";

export function SignatureBlock({
  title,
  cargo,
  labelsH = 9.7,
  signH = 21.2,
  fechaValue,
}: {
  title: string;
  cargo?: string;
  labelsH?: number;
  signH?: number;
  fechaValue?: Date | null;
}) {
  return (
    <>
      <Row h={9.7}>
        <Cell end className="items-start leading-[1.15] font-bold">
          {title}
        </Cell>
      </Row>
      <Row h={labelsH}>
        <Cell w="w-[26.4%]">
          <span>Nombre y apellidos</span>
        </Cell>
        <Cell w="w-[26.3%]">
          <span>Cargo{cargo ? `: ${cargo}` : ":"}</span>
        </Cell>
        <Cell w="w-[14.6%]">
          <span>Fecha:</span>
        </Cell>
        <Cell end>
          <span>Firma</span>
        </Cell>
      </Row>
      <Row h={signH}>
        <Cell w="w-[26.4%]" />
        <Cell w="w-[26.3%]" />
        <Cell w="w-[14.6%]" className="items-end justify-end pb-[2pt]">
          <span className="whitespace-nowrap">
            {formatDate(fechaValue) || DATE_PH}
          </span>
        </Cell>
        <Cell end />
      </Row>
    </>
  );
}
