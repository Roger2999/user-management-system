import Link from "next/link";
import { Users } from "lucide-react";

export default function TotalAccountsLink({ count }: { count: number }) {
  return (
    <Link
      className="text-brand bg-brand/5 border-brand/20 hover:bg-brand/10 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors"
      href="/dashboard/user-accounts-management/users?filter=all"
      title="Ver todas las cuentas"
    >
      <Users className="size-4" />
      {count}
    </Link>
  );
}
