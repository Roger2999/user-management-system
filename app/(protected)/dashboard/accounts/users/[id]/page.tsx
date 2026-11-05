import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import DocumentPreview from "./components/document-preview";

export default async function UserDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await prisma.accountRequest.findUnique({
    where: { id },
    include: { signatures: true },
  });

  if (!user) notFound();

  return <DocumentPreview user={user} />;
}
