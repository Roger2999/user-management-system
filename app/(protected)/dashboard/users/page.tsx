import prisma from "@/lib/prisma";

export default async function UsersPage() {
  const users = await prisma.accountRequest.findMany();
  return (
    <>
      <h1>Usuarios:</h1>
      <ul className="">
        {users.map((user) => (
          <li key={user.id}>{user.nombreApellidos}</li>
        ))}
      </ul>
    </>
  );
}
