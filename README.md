# User Management System

Sistema de autenticación y gestión de usuarios construido con Next.js, Better Auth y Prisma.

## Stack

- **Framework:** Next.js 16 (App Router)
- **Auth:** Better Auth v1.6
- **ORM:** Prisma v7
- **Database:** PostgreSQL (Prisma Postgres)
- **UI:** shadcn/ui + Tailwind CSS v4
- **Runtime:** React 19, TypeScript 5

## Características

- Registro de usuarios (sign up)
- Inicio de sesión con email y contraseña (sign in)
- Protección de rutas por sesión
- Dashboard con información del usuario
- Tema claro / oscuro / sistema

## Estructura del proyecto

```
app/
├── (auth)/
│   ├── signin/          # Inicio de sesión
│   ├── signup/          # Registro
│   └── dashboard/       # Dashboard protegido
├── api/auth/[...all]/   # API routes de Better Auth
└── layout.tsx           # Layout raíz
lib/
├── auth.ts              # Configuración server de Better Auth
├── auth-client.ts       # Configuración client de Better Auth
├── prisma.ts            # PrismaClient singleton
└── types.d.ts           # Tipos TypeScript
prisma/
├── schema.prisma        # Modelos: User, Session, Account, Verification
└── migrations/          # Migraciones de Prisma
```

## Instalación

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```bash
BETTER_AUTH_SECRET=tu-secreto-aqui
BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL="postgres://USUARIO:PASSWORD@db.prisma.io:5432/postgres?sslmode=require"
```

### 3. Aplicar migraciones

```bash
pnpm dlx prisma migrate dev
```

### 4. Generar Prisma Client

```bash
pnpm dlx prisma generate
```

### 5. Iniciar el servidor de desarrollo

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Comandos útiles

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Iniciar servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm lint` | Ejecutar ESLint |
| `pnpm dlx prisma studio` | Abrir Prisma Studio (editor visual de la DB) |
| `pnpm dlx prisma migrate dev` | Aplicar/crear migraciones |
| `pnpm dlx prisma generate` | Regenerar Prisma Client |

## Desarrollo local sin internet

Para desarrollar sin conexión a Prisma Postgres, usa `prisma dev` que crea un PostgreSQL local:

```bash
# Terminal 1: Base de datos local
pnpm dlx prisma dev

# Terminal 2: Servidor de desarrollo
pnpm dev
```

Cuando uses `prisma dev`, actualiza el `DATABASE_URL` en `.env` con el connection string local que se muestra al ejecutar el comando.

## Deploy

La app está configurada para deploy en Vercel. Asegúrate de configurar las variables de entorno en el dashboard de Vercel:

- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL` (URL de producción)
- `DATABASE_URL`
