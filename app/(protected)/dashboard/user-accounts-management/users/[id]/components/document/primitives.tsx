import type { ReactNode } from "react";

export const DATE_PH = "____/___/202__";

export const formatDate = (date: Date | null | undefined): string | null => {
  if (!date) return null;
  return date.toLocaleDateString("es-CU");
};

export function CB({ checked }: { checked: boolean }) {
  return (
    <span className="whitespace-pre">[{checked ? "X" : "\u00A0\u00A0"}]</span>
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
