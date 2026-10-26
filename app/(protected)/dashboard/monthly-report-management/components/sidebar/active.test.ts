import { describe, expect, it } from "vitest";
import { activeRouteHref } from "./active";

const ROUTES = [
  { href: "/dashboard/monthly-report-management" },
  { href: "/dashboard/monthly-report-management/new" },
];

describe("activeRouteHref", () => {
  it("activa la raíz en la lista y con barra final", () => {
    expect(
      activeRouteHref("/dashboard/monthly-report-management", ROUTES),
    ).toBe("/dashboard/monthly-report-management");
    expect(
      activeRouteHref("/dashboard/monthly-report-management/", ROUTES),
    ).toBe("/dashboard/monthly-report-management");
  });

  it("activa Nuevo informe y no la raíz en /new", () => {
    expect(
      activeRouteHref("/dashboard/monthly-report-management/new", ROUTES),
    ).toBe("/dashboard/monthly-report-management/new");
    expect(
      activeRouteHref("/dashboard/monthly-report-management/new/", ROUTES),
    ).toBe("/dashboard/monthly-report-management/new");
  });

  it("activa Informes en el detalle por id", () => {
    expect(
      activeRouteHref("/dashboard/monthly-report-management/abc123", ROUTES),
    ).toBe("/dashboard/monthly-report-management");
  });

  it("no activa nada fuera de la sección", () => {
    expect(activeRouteHref("/dashboard", ROUTES)).toBeNull();
    expect(activeRouteHref("/", ROUTES)).toBeNull();
  });

  it("no confunde una ruta hermana con un prefijo de texto", () => {
    const routes = [
      { href: "/dashboard/monthly-report-management" },
      { href: "/dashboard/monthly-report-management/news" },
    ];

    expect(
      activeRouteHref("/dashboard/monthly-report-management/new", routes),
    ).toBe("/dashboard/monthly-report-management");
  });
});
