# User Management System

Sistema de autenticación, gestión de solicitudes de cuentas de usuario y flujo de aprobación con firmas por etapas. Construido con Next.js, Better Auth y Prisma.

## Funcionalidades

| Módulo | Descripción |
|--------|-------------|
| Autenticación | Inicio de sesión por **username** + contraseña, registro de usuarios, cierre de sesión |
| Recuperación de contraseña | Email con enlace de restablecimiento (Resend), token con expiración |
| Roles y autorización | `USER` / `ADMIN`; toda la gestión exige rol `ADMIN` (server actions + rutas protegidas) |
| Solicitudes de cuenta | Alta, actualización y baja de cuentas de usuario, con validación de campos únicos |
| Flujo de firmas | Etapas `Solicitado → Revisado → Aprobado → Ejecutado`, inmutables y ordenadas |
| Dashboard | Estadísticas de solicitudes: pendientes de firma, expiradas, por tipo y por cuenta |
| Configuración | Editar perfil (username / nombre visible), cambiar contraseña, revocar sesiones |
| Extras | Tema claro / oscuro / océano / sistema, impresión de plantilla de solicitud, búsqueda y filtros |

## Stack

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Auth | Better Auth v1.6 (plugin username + email/password) |
| ORM / DB | Prisma v7 con PostgreSQL (Prisma Postgres) |
| UI | shadcn/ui + Tailwind CSS v4, Radix UI |
| Validación | Zod 4 |
| Email | Resend |
| Estado | Zustand |

## Roles y autorización

| Rol | Qué puede hacer |
|-----|-----------------|
| `USER` (default) | Dashboard personal, configuración de su cuenta |
| `ADMIN` | Todo lo de `USER` + crear, editar, borrar y firmar solicitudes de cuenta, y ver las estadísticas de gestión |

La protección se aplica en dos capas:

- **Server actions**: `helpers/requireAdmin.ts` corta la ejecución sin sesión (`/signin`) o sin rol `ADMIN` (`/dashboard`).
- **Rutas**: el layout de `user-accounts-management/` aplica la misma guardia; la card de gestión del dashboard solo se muestra a admins.

Para promover un administrador por username:

```bash
pnpm exec tsx prisma/promote-admin.ts <username>
```

> **Nota:** los usuarios creados antes del plugin de username pueden no tener `username` en la DB; el script no los cubre. En ese caso promové por búsqueda directa en la base.

## Estructura del proyecto

```
app/
├── (auth)/
│   ├── signin/                 # Login + forgot-password + reset-password
│   ├── signup/                 # Registro (email + username + password)
│   ├── verify-email-address/   # Resend de verificación (flujo inactivo en el código)
│   └── actions/                # signout
├── (protected)/dashboard/
│   ├── page.tsx                # Bienvenida + card de gestión (solo ADMIN)
│   ├── layout.tsx              # Protección de sesión
│   ├── components/             # Breadcrumbs, notificaciones, stats
│   ├── settings/               # Perfil, contraseña, sesiones
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
├── auth.ts                     # Config server de Better Auth
├── auth-client.ts              # Config client
├── prisma.ts                   # PrismaClient singleton (PrismaPg)
├── resend.ts                   # Cliente de email
├── constants.ts                # Rutas, opciones de formularios
└── types.d.ts                  # Tipos de estado de las server actions
prisma/
├── schema.prisma               # Modelos: User, Session, Account, Verification, AccountRequest, AccountRequestSignature
├── migrations/                 # Migraciones de Prisma
├── seed.ts                     # Datos de ejemplo (⚠️ borra solicitudes existentes)
└── promote-admin.ts            # Promueve un usuario a ADMIN por username
generated/prisma/               # Cliente Prisma generado (se commitea)
```

Cada ruta sigue la convención `actions/` (server actions), `models/` (validación Zod), `components/` y `page.tsx`.

## Inicio rápido

1. Instalar dependencias:

   ```bash
   pnpm install
   ```

2. Crear `.env` con las variables de [Variables de entorno](#variables-de-entorno)

3. Aplicar migraciones y generar el cliente:

   ```bash
   pnpm exec prisma migrate dev
   pnpm exec prisma generate
   ```

4. (Opcional) Crear el primer administrador:

   ```bash
   pnpm exec tsx prisma/promote-admin.ts <tu-username>
   ```

5. Levantar el servidor:

   ```bash
   pnpm dev
   ```

Abrí [http://localhost:3000](http://localhost:3000).

## Variables de entorno

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `DATABASE_URL` | Sí | Connection string de PostgreSQL |
| `BETTER_AUTH_SECRET` | Sí | Secreto de firma de sesiones |
| `BETTER_AUTH_URL` | Sí | URL base del servidor (```http://localhost:3000``` en dev) |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | No | URL base para el cliente (fallback a localhost) |
| `RESEND_API_KEY` | No* | Clave de Resend para emails (necesaria para recuperar contraseña) |

\* Si no configurás `RESEND_API_KEY`, el envío de emails de recuperación falla silenciosamente en el servidor.

## Comandos útiles

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm lint` | ESLint |
| `pnpm exec prisma studio` | Prisma Studio (editor visual de la DB) |
| `pnpm exec prisma migrate dev` | Crear/aplicar migraciones en desarrollo |
| `pnpm exec prisma migrate deploy` | Aplicar migraciones pendientes (producción) |
| `pnpm exec prisma generate` | Regenerar el cliente Prisma |
| `pnpm exec prisma db seed` | Cargar datos de ejemplo |
| `pnpm exec tsx prisma/promote-admin.ts <username>` | Promover administrador |

> **⚠️ Seed:** `pnpm exec prisma db seed` borra todas las solicitudes de cuenta existentes antes de insertar los ejemplos. No lo corras sobre datos reales.

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

> **Importante:** `lib/auth.ts` define `trustedOrigins` con las URLs permitidas (localhost y producción). Si cambiás de dominio, agregalo ahí y en `BETTER_AUTH_URL` antes de desplegar.

Una vez en producción, promové al administrador con el script `promote-admin.ts` contra la base de producción.