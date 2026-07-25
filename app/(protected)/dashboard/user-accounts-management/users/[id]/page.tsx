import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import DocumentPreview from "./components/DocumentPreview";

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

  return <DocumentPreview user={user} />;
}
