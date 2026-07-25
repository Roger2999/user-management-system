"use client";

import { useRef } from "react";
import type { AccountRequest } from "@/generated/prisma/client";
import UserAccountDocument from "./UserAccountDocument";
import { PrintButton } from "./print-button";

interface Props {
  user: AccountRequest;
}

export default function DocumentPreview({ user }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div className="bg-muted/40 min-h-screen p-4 print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-3xl justify-end print:hidden">
        <PrintButton contentRef={contentRef} />
      </div>
      <div
        ref={contentRef}
        data-print-target
        className="mx-auto w-[210mm] max-w-full bg-white p-[12mm] shadow-lg print:w-auto print:p-0 print:shadow-none"
      >
        <UserAccountDocument user={user} />
      </div>
    </div>
  );
}
