/**
 * Devuelve el href del ítem activo del sidebar.
 *
 * Un ítem está activo si la ruta actual es igual a su href o cuelga de él. Si
 * más de uno coincide, gana el href más largo: en `/new`, "Nuevo informe" gana
 * sobre "Historial de informes" (href raíz); en `/[id]`, solo el href raíz
 * coincide, así que "Historial de informes" queda activo.
 *
 * La comparación por prefijo incluye la barra final para no activar una ruta
 * hermana por accidente (`/new` no debe activar `/news`).
 */
export function activeRouteHref(
  pathname: string,
  routes: readonly { href: string }[],
): string | null {
  const matches = routes.filter(
    (route) =>
      pathname === route.href || pathname.startsWith(`${route.href}/`),
  );

  if (matches.length === 0) return null;

  return matches.reduce((longest, route) =>
    route.href.length > longest.href.length ? route : longest,
  ).href;
}
