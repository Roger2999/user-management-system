import type { ReactNode } from "react";

export const DATE_PH = "____/___/202__";

export const formatDate = (date: Date | null | undefined): string | null => {
  if (!date) return null;
  return date.toLocaleDateString("es-CU");
};

export function CB({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-[7.2pt] w-[7.2pt] shrink-0 self-center items-center justify-center border-[0.6pt] border-black text-[6.6pt] leading-none"
    >
      {checked ? "X" : ""}
    </span>
  );
}

export function Row({
  children,
  h,
  last = false,
}: {
  children: ReactNode;
  h?: number;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-stretch overflow-hidden ${
        last ? "" : "border-b-[0.5pt] border-black"
      }`}
      style={{ minHeight: h ? `${h}pt` : undefined }}
    >
      {children}
    </div>
  );
}

export function Cell({
  children,
  w,
  end = false,
  className = "",
}: {
  children?: ReactNode;
  w?: string;
  end?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center px-[4pt] ${
        end ? "" : "border-r-[0.5pt] border-black"
      } ${w ?? "flex-1"} ${className}`}
    >
      {children}
    </div>
  );
}
