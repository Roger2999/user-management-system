# User Management System

Aplicación interna de autenticación, solicitudes de cuentas de usuario con firmas por etapas e informes mensuales de tráfico web. Next.js 16 (App Router), Better Auth y Prisma 7 sobre PostgreSQL.

## Módulos

| Módulo                | Descripción                                                                                                                   |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Autenticación         | Login por `username` + contraseña. Registro público deshabilitado.                                                            |
| Solicitudes de cuenta | Alta (`NEW`), actualización (`UPDATE`) y baja (`DEPROVISIONING`), con validación de campos únicos.                            |
| Firmas                | Etapas `requested → revised → approved → executed`, ordenadas e inmutables.                                                   |
| Informes mensuales    | Importación de `access.log` diarios de Squid, cobertura del período, hallazgos por categoría prohibida y emisión del `.docx`. |
| Gestión de cuentas    | Lista con búsqueda y filtros, y tarjetas de estado: pendientes de firma, expiradas, por expirar y por tipo.                   |
| Dashboard             | Bienvenida y accesos a gestión de cuentas e informes (solo `ADMIN`).                                                          |
| Configuración         | Perfil, contraseña y sesiones. Un `ADMIN` además crea usuarios, restablece contraseñas y revoca sesiones ajenas.              |

## Stack

| Capa       | Tecnología                                         |
| ---------- | -------------------------------------------------- |
| Framework  | Next.js 16 (App Router), React 19, TypeScript      |
| Auth       | Better Auth 1.6 (plugin username + email/password) |
| Datos      | Prisma 7 con PostgreSQL                            |
| UI         | Tailwind CSS 4, shadcn/ui, Radix UI                |
| Validación | Zod 4                                              |
| Email      | Resend                                             |
| Tests      | Vitest                                             |

## Roles y autorización

| Rol              | Alcance                                                                                  |
| ---------------- | ---------------------------------------------------------------------------------------- |
| `USER` (default) | Dashboard propio y configuración de su cuenta.                                           |
| `ADMIN`          | Todo lo anterior + solicitudes, firmas, informes mensuales y administración de usuarios. |

La autorización se aplica en tres capas: `proxy.ts` redirige sin sesión, los layouts de `accounts/` y `monthly-reports/` exigen `ADMIN`, y las server actions de administración vuelven a validar con `lib/requireAdmin.ts`.

## Altas y recuperación de contraseña

- **Nuevos usuarios:** un `ADMIN` los crea desde `Configuración → Crear usuario`, con rol `USER` o `ADMIN`.
- **Contraseña olvidada:** el usuario usa el enlace del login y recibe un email con un token de 1 hora. Si el correo no llega, un `ADMIN` la restablece desde `Configuración → Restablecer contraseña`; la acción revoca las sesiones abiertas de esa cuenta.
- **Promover un usuario existente:**

  ```bash
  pnpm exec tsx prisma/promote-admin.ts <username>
  ```

  El script busca por `username`; las cuentas creadas antes del plugin de username no lo tienen y deben promoverse por búsqueda directa en la base.

## Reglas de integridad

- Una solicitud con al menos una firma no se puede editar ni eliminar (se valida en la UI y en la server action).
- Cada solicitud guarda `createdByUserId` / `updatedByUserId`.
- Crear, editar, borrar y firmar escriben una entrada en `AuditLog`.

## Puesta en marcha

1. Instalar dependencias y crear el entorno:

   ```bash
   pnpm install
   cp .env.example .env
   ```

2. Completar `.env` según [Variables de entorno](#variables-de-entorno).

3. Aplicar migraciones y crear el administrador inicial:

   ```bash
   pnpm db:migrate
   pnpm db:seed        # admin / admin, solo si la tabla user está vacía
   pnpm db:seed:rules  # patrones de categorías prohibidas de los informes
   ```

4. Levantar el servidor con `pnpm dev` y abrir <http://localhost:3000>.

> Sin un PostgreSQL propio: `pnpm exec prisma dev` levanta una instancia local e imprime el `DATABASE_URL` que debe ir en `.env`.

El cliente Prisma se genera solo (`postinstall`, `predev`, `prebuild`) y no se versiona. Si cambias `schema.prisma`, usa `pnpm db:generate`.

## Variables de entorno

| Variable                       | Requerida     | Uso                                                                                                                                          |
| ------------------------------ | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                 | Sí            | Connection string de PostgreSQL.                                                                                                             |
| `BETTER_AUTH_SECRET`           | Sí            | Secreto de firma de sesiones (`openssl rand -base64 32`).                                                                                    |
| `BETTER_AUTH_URL`              | Sí            | URL base del servidor. Debe empezar por `https://` en producción: activa cookies `Secure`, HSTS y CSP con `upgrade-insecure-requests`.       |
| `NEXT_PUBLIC_BETTER_AUTH_URL`  | No            | URL base para el cliente. Fallback a localhost.                                                                                              |
| `RESEND_API_KEY`               | Recomendada   | Envío de emails de recuperación. Sin clave válida el envío falla y queda en el log; el resto de la app funciona.                             |
| `REPORTS_TEMPLATE_PATH`        | Solo informes | Ruta del `.docx` oficial. Si queda vacía se usa `storage/templates/monthly-report.docx`; sin el archivo, la generación falla.                |
| `REPORTS_STORAGE_DIR`          | No            | Directorio de los `.docx` emitidos. Por defecto `storage/reports`. Contiene datos de navegación de personas: permisos restringidos y backup. |
| `CONNECTION_STRING_ACCELERATE` | No            | Connection string de Prisma Accelerate.                                                                                                      |
| `GITHUB_CLIENT_ID`             | No            | Client ID de GitHub OAuth (login social).                                                                                                    |
| `GITHUB_CLIENT_SECRET`         | No            | Secret de GitHub OAuth.                                                                                                                      |
| `SEED_ADMIN_*`                 | No            | Username, contraseña, email, nombre y cargo del admin inicial. Valores por defecto: `admin` / `admin` / `admin@localhost`.                   |
| `AD_URL`                       | No          | URL LDAPS del controlador de dominio (`ldaps://dc.tu-empresa.local:636`). Las cuatro variables de AD llenan el directorio de cuentas; sin ellas el botón «Sincronizar desde AD» queda deshabilitado |
| `AD_BIND_DN`                   | No          | DN de la cuenta de servicio de solo lectura en el dominio                                                                                          |
| `AD_BIND_PASSWORD`             | No          | Contraseña de esa cuenta de servicio                                                                                                               |
| `AD_USER_SEARCH_BASE`          | No          | DN de la OU de usuarios a sincronizar (dominio completo)                                                                                            |
| `AD_TLS_INSECURE`              | No          | `true` para aceptar el certificado autofirmado del DC. Déjalo vacío en un dominio con CA interna                                                     |

## Comandos

| Comando                                            | Descripción                                                 |
| -------------------------------------------------- | ----------------------------------------------------------- |
| `pnpm dev`                                         | Servidor de desarrollo.                                     |
| `pnpm build` / `pnpm start`                        | Build y arranque de producción.                             |
| `pnpm lint`                                        | ESLint.                                                     |
| `pnpm test` / `pnpm test:watch`                    | Tests unitarios.                                            |
| `pnpm db:migrate`                                  | Crear y aplicar migraciones en desarrollo.                  |
| `pnpm db:generate`                                 | Regenerar el cliente Prisma.                                |
| `pnpm db:seed`                                     | Crear el admin inicial si no existe ningún usuario.         |
| `pnpm db:seed:rules`                               | Cargar los patrones de categorías prohibidas (idempotente). |
| `pnpm exec prisma migrate deploy`                  | Aplicar migraciones pendientes en producción.               |
| `pnpm exec prisma studio`                          | Editor visual de la base.                                   |
| `pnpm exec tsx prisma/promote-admin.ts <username>` | Promover un usuario a `ADMIN`.                              |
| `pnpm exec tsx prisma/wipe-requests.ts`            | Borrar solicitudes y firmas. Solo desarrollo.               |

> `wipe-requests.ts` borra **todas** las solicitudes y firmas; los datos de autenticación (`user`, `session`, `account`, `verification`) no se tocan. No lo ejecutes sobre datos reales.

## Tests

Son tests unitarios con Vitest: no levantan base de datos ni navegador. Cubren el plan de firmas, las acciones de configuración, los filtros del listado y el pipeline de informes (parser de Squid, métricas, hallazgos y emisión del `.docx`).

## Estructura

```text
app/
├── (auth)/signin/                  # Login, forgot-password y reset-password
├── (protected)/dashboard/
│   ├── page.tsx                    # Bienvenida y accesos (solo ADMIN)
│   ├── settings/                   # Perfil, contraseña, sesiones y administración de usuarios
│   ├── accounts/                   # Solicitudes: lista, crear, editar, firmar, borrar
│   └── monthly-reports/            # Historial, importación y generación de informes
├── api/auth/[...all]/              # Handler de Better Auth
└── api/reports/                    # Importación de logs y descarga del .docx

components/                         # Navegación y componentes compartidos (shadcn/ui en ui/)
modules/                            # Dominios con lógica propia y sus tests
├── reports/                        # Pipeline de informes: parser, métricas, hallazgos, .docx
├── ad/                             # Sincronización con Active Directory (LDAPS)
└── accounts/                       # Predicados compartidos de solicitudes (expiración, firmas)

lib/                                # Infraestructura transversal, sin lógica de rutas
├── auth.ts / auth-client.ts        # Better Auth (servidor y cliente)
├── db.ts                           # Tipos y enums generados de Prisma (barrel)
├── prisma.ts / audit.ts / resend.ts
├── getSession.ts / requireAdmin.ts # Sesión y guardas de autorización
├── errors.ts                       # DbError compartido por los form states
└── filters.ts / constants.ts

prisma/
├── schema.prisma                   # Auth, solicitudes, firmas, auditoría e informes
├── migrations/
├── seed-admin.ts                   # Admin inicial
├── seed-rules.ts                   # Patrones de categorías prohibidas
├── promote-admin.ts
└── wipe-requests.ts

generated/prisma/                   # Cliente Prisma generado (no versionado)
```

Las rutas de solicitudes y configuración agrupan `actions/` (server actions), `models/` (Zod y tipos de su formulario), `components/` y `page.tsx`. Los tipos de estado de formulario viven en la feature que los usa, nunca en `lib/`; `lib/errors.ts` solo expone el `DbError` común.

Acceso a datos: las lecturas van por `services/` o por el server component que las necesita, y las escrituras pasan por una server action. Prisma no se importa desde componentes de cliente, y todo lo generado por Prisma se importa desde `@/lib/db`, no desde la ruta del generador.

## Despliegue

La app se despliega en Vercel, o en la LAN sobre Proxmox/LXC con TLS interno. Los pasos de producción (variables, systemd, Nginx, certificados, backups y actualizaciones) están en [`DEPLOYMENT_GUIDE.md`](docs/DEPLOYMENT_GUIDE.md).

En cualquier destino, antes del primer login:

1. Definir `BETTER_AUTH_URL` y agregar ese origen a `trustedOrigins` en `lib/auth.ts` (un cambio ahí exige rebuild).
2. Ejecutar `pnpm db:seed` y `pnpm db:seed:rules` contra la base de producción.
3. Cambiar la contraseña del administrador desde Configuración.
