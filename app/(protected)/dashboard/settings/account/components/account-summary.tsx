type Props = {
  fullName: string;
  username?: string | null;
  email: string;
  role: string;
  position?: string | null;
};

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  USER: "Usuario",
};

function initials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase();
}

export default function AccountSummary({
  fullName,
  username,
  email,
  role,
  position,
}: Props) {
  return (
    <div className="flex w-full flex-wrap items-center gap-4 rounded-xl border p-6">
      <span
        aria-hidden
        className="bg-muted text-muted-foreground flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
      >
        {initials(fullName)}
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate text-lg font-semibold">{fullName}</p>
        <p className="text-muted-foreground truncate text-sm">
          {username ? `@${username} · ` : ""}
          {email}
          {position ? ` · ${position}` : ""}
        </p>
      </div>
      <span className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-medium">
        {ROLE_LABEL[role] ?? role}
      </span>
    </div>
  );
}
