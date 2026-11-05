import { Row, Cell, formatDate } from "./primitives";
import { DATE_PH } from "./primitives";

export function SignatureBlock({
  title,
  position,
  labelsH = 9.7,
  signH = 21.2,
  dateValue,
  nameValue,
  positionValue,
}: {
  title: string;
  position?: string;
  labelsH?: number;
  signH?: number;
  dateValue?: Date | null;
  nameValue?: string;
  positionValue?: string;
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
          <span>Cargo{position ? `: ${position}` : ":"}</span>
        </Cell>
        <Cell w="w-[14.6%]">
          <span>Fecha:</span>
        </Cell>
        <Cell end>
          <span>Firma</span>
        </Cell>
      </Row>
      <Row h={signH}>
        <Cell w="w-[26.4%]">{nameValue ? <span>{nameValue}</span> : null}</Cell>
        <Cell w="w-[26.3%]">
          {positionValue ? <span>{positionValue}</span> : null}
        </Cell>
        <Cell w="w-[14.6%]" className="items-end justify-end pb-[2pt]">
          <span className="whitespace-nowrap">
            {formatDate(dateValue) || DATE_PH}
          </span>
        </Cell>
        <Cell end />
      </Row>
    </>
  );
}
