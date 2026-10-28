import { describe, expect, it } from "vitest";
import { activeRouteHref } from "./active";

const ROUTES = [
  { href: "/dashboard/monthly-reports" },
  { href: "/dashboard/monthly-reports/new" },
];

describe("activeRouteHref", () => {
  it("activa la raíz en la lista y con barra final", () => {
    expect(
      activeRouteHref("/dashboard/monthly-reports", ROUTES),
    ).toBe("/dashboard/monthly-reports");
    expect(
      activeRouteHref("/dashboard/monthly-reports/", ROUTES),
    ).toBe("/dashboard/monthly-reports");
  });

  it("activa Nuevo informe y no la raíz en /new", () => {
    expect(
      activeRouteHref("/dashboard/monthly-reports/new", ROUTES),
    ).toBe("/dashboard/monthly-reports/new");
    expect(
      activeRouteHref("/dashboard/monthly-reports/new/", ROUTES),
    ).toBe("/dashboard/monthly-reports/new");
  });

  it("activa Historial de informes en el detalle por id", () => {
    expect(
      activeRouteHref("/dashboard/monthly-reports/abc123", ROUTES),
    ).toBe("/dashboard/monthly-reports");
  });

  it("no activa nada fuera de la sección", () => {
    expect(activeRouteHref("/dashboard", ROUTES)).toBeNull();
    expect(activeRouteHref("/", ROUTES)).toBeNull();
  });

  it("no confunde una ruta hermana con un prefijo de texto", () => {
    const routes = [
      { href: "/dashboard/monthly-reports" },
      { href: "/dashboard/monthly-reports/news" },
    ];

    expect(
      activeRouteHref("/dashboard/monthly-reports/new", routes),
    ).toBe("/dashboard/monthly-reports");
  });
});
