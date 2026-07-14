import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import UserAccountDocument from "./components/UserAccountDocument";
import { PrintButton } from "./components/print-button";

export default async function UserDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await prisma.accountRequest.findUnique({
    where: { id },
  });

  if (!user) notFound();

  return (
    <div className="min-h-screen bg-muted/40 p-4 print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-3xl justify-end print:hidden"></div>
      <PrintButton />
      <div className="mx-auto w-[210mm] max-w-full bg-white p-[12mm] shadow-lg print:w-auto print:p-0 print:shadow-none">
        <UserAccountDocument user={user} />
      </div>
    </div>
  );
}
