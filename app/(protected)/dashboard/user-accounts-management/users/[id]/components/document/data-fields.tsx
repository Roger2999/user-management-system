import { CB, Row, Cell } from "./primitives";

export function DataField({
  label,
  value,
  h = 12.7,
}: {
  label: string;
  value?: string | null;
  h?: number;
}) {
  return (
    <Row h={h}>
      <Cell end>
        <span className="shrink-0 font-bold">{label}</span>
        <span className="ml-[4pt] flex-1">{value || "\u00A0"}</span>
      </Cell>
    </Row>
  );
}

export function Banner({ children }: { children: React.ReactNode }) {
  return (
    <Row h={9.7}>
      <div className="flex-1 text-center font-bold">{children}</div>
    </Row>
  );
}

export function OptionRow({ label, yes }: { label: string; yes: boolean }) {
  return (
    <Row h={9.7}>
      <Cell w="w-[35.2%]" className="pr-4">
        <span>{label}</span>
        <span className="ml-auto" />
        <span className="flex shrink-0 items-center gap-1">
          <span>Si</span>
          <CB checked={yes} />
          <span>No</span>
          <CB checked={!yes} />
        </span>
      </Cell>
      <Cell end />
    </Row>
  );
}
