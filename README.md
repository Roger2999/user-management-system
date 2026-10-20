# User Management System

Sistema de autenticación, gestión de solicitudes de cuentas de usuario y flujo de aprobación con firmas por etapas. Construido con Next.js, Better Auth y Prisma.

## Funcionalidades

| Módulo                     | Descripción                                                                                                          |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Autenticación              | Inicio de sesión por **username** + contraseña, alta de usuarios por **ADMIN** desde Configuración, cierre de sesión |
| Recuperación de contraseña | Email con enlace de restablecimiento (Resend), token con expiración                                                  |
| Roles y autorización       | `USER` / `ADMIN`; toda la gestión exige rol `ADMIN` (server actions + rutas protegidas)                              |
| Solicitudes de cuenta      | Alta, actualización y baja de cuentas de usuario, con validación de campos únicos                                    |
| Flujo de firmas            | Etapas `Solicitado → Revisado → Aprobado → Ejecutado`, inmutables y ordenadas                                        |
| Dashboard                  | Estadísticas de solicitudes: pendientes de firma, expiradas, por tipo y por cuenta                                   |
| Configuración              | Editar perfil (username / nombre visible), cambiar contraseña, revocar sesiones                                      |
| Extras                     | Tema claro / oscuro / océano / sistema, impresión de plantilla de solicitud, búsqueda y filtros                      |

## Stack

| Capa       | Tecnología                                          |
| ---------- | --------------------------------------------------- |
| Framework  | Next.js 16 (App Router), React 19, TypeScript       |
| Auth       | Better Auth v1.6 (plugin username + email/password) |
| ORM / DB   | Prisma v7 con PostgreSQL (Prisma Postgres)          |
| UI         | shadcn/ui + Tailwind CSS v4, Radix UI               |
| Validación | Zod 4                                               |
| Email      | Resend                                              |
| Estado     | Zustand                                             |

## Roles y autorización

| Rol              | Qué puede hacer                                                                                                                        |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `USER` (default) | Dashboard personal, configuración de su cuenta                                                                                         |
| `ADMIN`          | Todo lo de `USER` + crear, editar, borrar y firmar solicitudes de cuenta, ver las estadísticas de gestión y crear usuarios del sistema |

La protección se aplica en dos capas:

- **Server actions**: `helpers/requireAdmin.ts` corta la ejecución sin sesión (`/signin`) o sin rol `ADMIN` (`/dashboard`).
- **Rutas**: el layout de `user-accounts-management/` aplica la misma guardia; la card de gestión del dashboard solo se muestra a admins.

Para promover un administrador por username:

```bash
pnpm exec tsx prisma/promote-admin.ts <username>
```

> **Nota:** los usuarios creados antes del plugin de username pueden no tener `username` en la DB; el script no los cubre. En ese caso promové por búsqueda directa en la base.

## Alta de usuarios y administrador inicial

El registro público está deshabilitado (`disableSignUp` en `lib/auth.ts`). Las cuentas se crean así:

- **Administrador inicial:** `pnpm db:seed` crea `admin` / `admin` (configurable con `SEED_ADMIN_*`) **solo si la tabla `user` está vacía**. Cambiá la contraseña después del primer login.
- **Usuarios nuevos:** un `ADMIN` los crea desde `Configuración → Crear usuario`, con rol `USER` o `ADMIN`.
- **Promover existentes:** `pnpm exec tsx prisma/promote-admin.ts <username>`.

## Reglas de integridad

- Una solicitud con al menos una firma **no se puede editar ni eliminar** (se valida en la UI y en la server action).
- Cada solicitud guarda `createdByUserId` / `updatedByUserId`.
- Crear, editar, borrar y firmar escriben una entrada en `AuditLog` (quién, qué acción, sobre qué solicitud y cuándo).
- El borrado de solicitudes sin firmas también queda auditado.

## Estructura del proyecto

```text
app/
├── (auth)/
│   ├── signin/                 # Login + forgot-password + reset-password
│   ├── verify-email-address/   # Resend de verificación (flujo inactivo)
│   └── actions/                # signout
├── (protected)/dashboard/
│   ├── page.tsx                # Bienvenida + card de gestión (solo ADMIN)
│   ├── layout.tsx              # Protección de sesión
│   ├── components/             # Breadcrumbs, notificaciones, stats
│   ├── settings/               # Perfil, contraseña, sesiones y alta de usuarios (ADMIN)
│   └── user-accounts-management/
│       ├── layout.tsx          # Guardia requireAdmin (toda la sección)
│       ├── services/           # getAccountsCount
│       └── users/              # Lista, crear, editar, firmar, borrar
├── api/auth/[...all]/route.ts  # Handler de Better Auth
└── layout.tsx / page.tsx / globals.css

components/                     # Nav (desktop/mobile), field, botones, ui/ (shadcn)
helpers/
├── getSession.ts               # Sesión cacheada por request
└── requireAdmin.ts             # Guardia de autorización
lib/
├── auth.ts                     # Config server de Better Auth (signup deshabilitado)
├── auth-client.ts              # Config client
├── prisma.ts                   # PrismaClient singleton (PrismaPg)
├── audit.ts                    # Helper de AuditLog
├── resend.ts                   # Cliente de email
├── constants.ts                # Rutas, opciones de formularios
└── types.d.ts                  # Tipos de estado de las server actions
prisma/
├── schema.prisma               # Modelos: User, Session, Account, Verification, AccountRequest, AccountRequestSignature, AuditLog
├── migrations/                 # Migraciones de Prisma
├── seed-admin.ts               # Admin inicial si la tabla user está vacía
├── promote-admin.ts            # Promueve un usuario a ADMIN por username
└── wipe-requests.ts            # Borra todas las solicitudes (solo desarrollo)
generated/prisma/               # Cliente Prisma generado (se regenera, no se versiona)
```

Cada ruta sigue la convención `actions/` (server actions), `models/` (validación Zod), `components/` y `page.tsx`.

## Inicio rápido

1. Instalar dependencias:

   ```bash
   pnpm install
   ```

2. Crear `.env` a partir del template:

   ```bash
   cp .env.example .env
   ```

   Después completá los valores de [Variables de entorno](#variables-de-entorno).

   > El cliente Prisma se genera solo: `pnpm install` lo corre por
   > `postinstall`, y `pnpm dev` / `pnpm build` lo seguras con `predev` y
   > `prebuild`. Si tocás `schema.prisma` y querés regenerarlo sin tocar
   > nada más, corré `pnpm db:generate`.

3. Aplicar migraciones:

   ```bash
   pnpm db:migrate
   ```

4. Crear el administrador inicial (solo si no existe ningún usuario):

   ```bash
   pnpm db:seed
   ```

   Usa `admin` / `admin` por defecto. Cambiá la contraseña desde Configuración después del primer login, o definí `SEED_ADMIN_*` antes de correrlo.

5. Levantar el servidor:

   ```bash
   pnpm dev
   ```

Abrí [http://localhost:3000](http://localhost:3000).

## Variables de entorno

| Variable                       | Obligatoria | Descripción                                                                                                                                       |
| ------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                 | Sí          | Connection string de PostgreSQL                                                                                                                   |
| `BETTER_AUTH_SECRET`           | Sí          | Secreto de firma de sesiones                                                                                                                      |
| `BETTER_AUTH_URL`              | Sí          | URL base del servidor (`http://localhost:3000` en dev)                                                                                            |
| `NEXT_PUBLIC_BETTER_AUTH_URL`  | No          | URL base para el cliente (fallback a localhost)                                                                                                   |
| `CONNECTION_STRING_ACCELERATE` | No          | Connection string de Prisma Accelerate                                                                                                            |
| `GITHUB_CLIENT_ID`             | No          | Client ID de GitHub OAuth (login social)                                                                                                          |
| `GITHUB_CLIENT_SECRET`         | No          | Secret de GitHub OAuth (login social)                                                                                                             |
| `RESEND_API_KEY`               | Recomendada | Clave de Resend para emails. Sin clave válida, la recuperación de contraseña falla (queda en el log) pero el build y el resto de la app funcionan |
| `SEED_ADMIN_USERNAME`          | No          | Username del admin inicial (`admin` por defecto)                                                                                                  |
| `SEED_ADMIN_PASSWORD`          | No          | Contraseña del admin inicial (`admin` por defecto; cambiala en producción)                                                                        |
| `SEED_ADMIN_EMAIL`             | No          | Email del admin inicial (`admin@localhost` por defecto)                                                                                           |
| `SEED_ADMIN_FULLNAME`          | No          | Nombre completo del admin inicial (`Administrador` por defecto)                                                                                   |
| `SEED_ADMIN_POSITION`          | No          | Cargo del admin inicial (`Administrador` por defecto)                                                                                             |

\* `lib/resend.ts` usa un placeholder cuando `RESEND_API_KEY` no está definida, para no romper el import ni el build. La recuperación de contraseña solo funciona con una clave real y un dominio verificado en Resend.

## Comandos útiles

| Comando                                            | Descripción                                                           |
| -------------------------------------------------- | --------------------------------------------------------------------- |
| `pnpm dev`                                         | Servidor de desarrollo                                                |
| `pnpm build`                                       | Build de producción                                                   |
| `pnpm lint`                                        | ESLint                                                                |
| `pnpm db:migrate`                                  | Crear/aplicar migraciones en desarrollo                               |
| `pnpm db:generate`                                 | Regenerar el cliente Prisma                                           |
| `pnpm db:seed`                                     | Crear el admin inicial si no existe ningún usuario                    |
| `pnpm exec prisma migrate deploy`                  | Aplicar migraciones pendientes (producción, no interactivo)           |
| `pnpm exec prisma studio`                          | Prisma Studio (editor visual de la DB)                                |
| `pnpm exec tsx prisma/promote-admin.ts <username>` | Promover administrador                                                |
| `pnpm exec tsx prisma/wipe-requests.ts`            | Vaciar solicitudes y firmas, conservando usuarios, sesiones y cuentas |

> El cliente Prisma **no está versionado**: vive en `generated/` y lo
> regeneran `pnpm install` (`postinstall`), `pnpm dev` (`predev`) y
> `pnpm build` (`prebuild`). Los ganchos existen porque pnpm omite
> `postinstall` cuando `pnpm install` no cambia nada; `predev` y `prebuild`
> corren siempre, así que el cliente nunca queda viejo.

> **⚠️ Wipe:** `pnpm exec tsx prisma/wipe-requests.ts` borra **todas** las
> solicitudes y firmas. Los datos de autenticación (`user`, `session`,
> `account`, `verification`) no se tocan. No lo corras sobre datos reales.

## Desarrollo local sin conexión a Prisma Postgres

Para levantar un PostgreSQL local:

```bash
# Terminal 1: Base de datos local
pnpm exec prisma dev

# Terminal 2: Servidor de desarrollo
pnpm dev
```

Cuando uses `prisma dev`, actualizá el `DATABASE_URL` en `.env` con el connection string local que imprime el comando.

## Deploy

La app está configurada para Vercel. En el dashboard configurá las variables de entorno de la tabla anterior, con `BETTER_AUTH_URL` y `NEXT_PUBLIC_BETTER_AUTH_URL` apuntando a la URL de producción.

> Para el despliegue interno en Proxmox/LXC con TLS propio, seguí `DEPLOYMENT_GUIDE.md`.

> **Importante:** `lib/auth.ts` define `trustedOrigins` con las URLs permitidas (localhost y producción). Si cambiás de dominio, agregalo ahí y en `BETTER_AUTH_URL` antes de desplegar.

Una vez en producción, creá el administrador inicial con `pnpm db:seed` contra la base de producción (solo actúa si no hay usuarios) y cambiá la contraseña desde Configuración. Para promover a un usuario existente, usá `promote-admin.ts`.
