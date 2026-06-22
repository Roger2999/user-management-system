import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function User({
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
    <>
      <div>{user.nombreApellidos}</div>
      <div>{user.folio}</div>
    </>
  );
}
