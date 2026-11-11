# Separación de rutas de Configuración

Objetivo: separar el autoservicio (perfil, contraseña, sesiones) de la
administración de usuarios (alta, restablecimiento de contraseñas, sincronización
con AD), que hoy comparten una sola página separada solo por un
`if (isAdmin)`. El corte elimina el payload cruzado entre ambas audiencias y
hace visible la frontera de permisos en la URL.
Rama `refactor/settings-split` · Estrategia: work-unit commits · Runner
`npx vitest run`.

## Specs

- **S1** — `/dashboard/settings` redirige a `/dashboard/settings/account`. No es
  un hub: no se agrega una tercera vista.
- **S2** — `/dashboard/settings/account` muestra el resumen de cuenta, el
  formulario de datos, el cambio de contraseña y la lista de sesiones. Solo
  requiere sesión.
- **S3** — `/dashboard/settings/administration` muestra el alta de usuarios, el
  restablecimiento de contraseñas y la tarjeta de `Directorio de cuentas`.
  Requiere rol `ADMIN`.
- **S4** — Un usuario sin rol `ADMIN` que navega a
  `/dashboard/settings/administration` es redirigido a `/dashboard`, y la página
  no ejecuta `prisma.user.findMany`.
- **S5** — `/dashboard/settings/account` no consulta Prisma: solo sesión y
  `auth.api.listSessions`.
- **S6** — Las revalidaciones apuntan a la ruta que muestra el dato: cuenta para
  contraseña y sesiones, administración para el restablecimiento ajeno.
- **S7** — Los breadcrumbs muestran `Mi cuenta` y `Administración`. El layout de
  Configuración conserva el H1 `Configuración` y agrega un selector con esos dos
  destinos; el destino de administración solo se muestra con rol `ADMIN`.
- **S8** — Cada ruta tiene su propio `loading.tsx`, fiel a su contenido real.
- **S9** — El estado de cada formulario vive en el modelo de su ruta:
  `account-form-states.ts` y `administration-form-states.ts`. El barril
  `settings-form-states.ts` desaparece.
- **S10** — La suite completa sigue en verde (línea base: 38 archivos, 287 tests
  pasan, 2 archivos y 9 tests saltados). No se elimina ni se salta ningún test.
- **S11** — `README.md`, `docs/AD_DIRECTORY_SETUP.md` y
  `docs/DEPLOYMENT_GUIDE.md` describen la navegación nueva.

## Tasks

- T1 (S1-S8) — Rutas, páginas, layout y skeletons. `inline`. Hecho en `765d120`.
- T2 (S9, S6, S10) — Modelos por ruta, revalidaciones y tests. `inline`. Hecho en `765d120` y `56bfa04`.
- T3 (S11) — Documentación. `inline`. Hecho en `69cb673` y `f536fd8`.

## Log

**L1** — "vamos a hacer analisis del diseno de @app/(protected)/dashboard/settings/
para mejorarlo en cuento a que actualmente todo esta en un solo sitio, dime que
opinas respecto a esto?"

**L2** — "vamos con tu recomendacion final, pero antes de aplicar algun cambio,
dame el plan de como lo harias?"

**L3** — "bien, adelente, y redirect" — autoriza la implementación con
`/dashboard/settings` como redirect, no como hub.

**L4** — Hallazgos del análisis: los tests de las acciones importan con
`await import("./archivo")`, así que viajan con su acción; los únicos imports
externos al módulo son `lib/constants.ts` (`href`) y los labels de
`breadcrumbs.tsx`. No hay consumidores externos de componentes ni modelos.

**L5** — Implementación (commits `765d120`, `69cb673`, `f536fd8`). Línea base
`42f8bd4`: 38 archivos y 287 tests en verde. Después del corte: 39 archivos y
299 tests en verde, `tsc --noEmit` limpio, `next build` registra
`/dashboard/settings`, `/dashboard/settings/account` y
`/dashboard/settings/administration`. `eslint` deja un único warning
preexistente (`_prevState` en `sync-ad-directory-action.ts`).

**L6** — Revisión nativa (lentes `review-risk`, `review-readability`):
aprobada, autoridad quemada en `review-4ff3cd1702fb383f`. El lente de riesgo no
encontró hallazgos: confirmó que `requireAdmin()` precede a
`prisma.user.findMany` y que las acciones conservan su guarda. El lente de
legibilidad dejó tres sugerencias informativas, no bloqueantes: (R2-001) las
rutas nuevas son literales repetidos en nav, redirect, revalidaciones y tests;
(R2-002) el cast de `displayUsername` en `account/page.tsx` es deuda previa;
(R2-003) la regla de sesión se expresa en tres lugares. R2-003 no cuesta un
round-trip: `getSession` está envuelto en `cache()`. Quedan como trabajo
posterior, no reabren este candidato.

**L7** — Verificador independiente: sin bloqueantes, S1–S11 cumplidos. Sus 12
probes se commitearon como `settings-routes.test.ts` (`56bfa04`); prueba de
mutación: al quitar `requireAdmin()` de `administration/page.tsx`, dos casos
fallan. El commit de tests midió riesgo medio con `review due: under_budget`;
el boundary revisado se queda en `f536fd8` y el slice de tests queda pendiente
hasta que un commit posterior alcance el presupuesto.

**L8** — Pendiente fuera de alcance: `lib/audit.ts` y `lib/auth.ts` siguen con
cambios sin commitear, ajenos a este refactor.

**L9** — Reparto en slices de entrega, medido sobre `42f8bd4`: la rama acumulada
mezclaba el refactor con cinco commits ajenos (+14/−15 y un chore de −12). Se
separa en dos PRs y se deja `90aa7c6` fuera como chore suelto.

- **Slice 1 — split de settings** (rama `refactor/settings-split-pr`, desde
  `9556c91`): `765d120`, `69cb673`, `f536fd8`, `56bfa04`, `9556c91` y el
  cherry-pick `4a89264` de `aefa597` (los labels de breadcrumbs pertenecen al
  mapa que introduce el corte). 40 archivos, +589/−181; 20 de esos archivos son
  movimientos con `git mv`, así que con `git diff -M` la superficie real de
  revisión ronda las 430 líneas.
- **Slice 2 — campana de notificaciones** (rama
  `fix/dashboard-notification-bell`, desde `main`): `3ee61a1`, `4b18762` y
  `ce990af`, cherry-picked como `ceedd14`, `afcebba` y `87fb2c8`. 3 archivos,
  +11/−12. No depende del slice 1: no comparten hunks.
- **Verificación de cada slice:** `npx vitest run` (38 archivos / 287 tests en
  verde, 2 archivos y 9 tests saltados: línea base de `42f8bd4`) y
  `npx tsc --noEmit` limpio. Ojo con `tsc`: el caché `.next` heredado de la rama
  de settings produce errores `TS2307` falsos hasta que se borra `.next`.
