/**
 * Public data-layer surface for generated Prisma types and enums.
 *
 * Application code imports from here instead of the generator output path, so
 * moving or regenerating the client never touches import sites.
 *
 * Only the generated enum values and types live here. The `client` entrypoint
 * pulls Node builtins at module load (`node:process`, `node:path`, `node:url`),
 * so it is re-exported with `import type` only. The server-only client instance
 * stays in `lib/prisma.ts`.
 */
export * from "@/generated/prisma/enums";
export type * from "@/generated/prisma/client";
