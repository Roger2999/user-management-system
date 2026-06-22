import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function UsersPage() {
  const users = await prisma.accountRequest.findMany();
  return (
    <>
      <h1>Usuarios:</h1>
      <ul className="mt-2 space-y-2">
        {users.map((user) => (
          <li className="hover:text-green-500 cursor-pointer" key={user.id}>
            <Link href={`/dashboard/users/${user.id}`}>
              {user.nombreApellidos}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
