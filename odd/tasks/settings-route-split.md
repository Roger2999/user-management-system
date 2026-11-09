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

- T1 (S1-S8) — Rutas, páginas, layout y skeletons. `inline`.
- T2 (S9, S6, S10) — Modelos por ruta, revalidaciones y tests. `inline`.
- T3 (S11) — Documentación. `inline`.

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
