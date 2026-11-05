import { describe, expect, it } from "vitest";
import {
  classifySite,
  extractSite,
  isInternalSite,
  isNationalSite,
  isTelemetrySite,
  isWebmailSite,
  matchesDomainOrSubdomain,
} from "./site";

describe("extractSite", () => {
  it("toma el hostname de una URL completa", () => {
    expect(extractSite("http://www.picta.cu/noticia/1")).toBe("www.picta.cu");
    expect(extractSite("https://www.youtube.com/watch?v=x")).toBe(
      "www.youtube.com",
    );
  });

  it("quita el puerto de los túneles CONNECT y normaliza a minúsculas", () => {
    expect(extractSite("WWW.Facebook.com:443")).toBe("www.facebook.com");
  });

  it("conserva el literal IPv6", () => {
    expect(extractSite("[2001:db8::1]:8080")).toBe("[2001:db8::1]");
  });

  it("descarta credenciales embebidas en la URL", () => {
    expect(extractSite("http://usuario:clave@host.cu/x")).toBe("host.cu");
  });

  it("devuelve null cuando no puede determinar el sitio", () => {
    expect(extractSite("")).toBeNull();
    expect(extractSite("http://")).toBeNull();
    expect(extractSite("texto con espacios")).toBeNull();
  });
});

describe("matchesDomainOrSubdomain", () => {
  it("coincide con el dominio exacto y sus subdominios", () => {
    expect(matchesDomainOrSubdomain("une.cu", "une.cu")).toBe(true);
    expect(matchesDomainOrSubdomain("elecmtz.une.cu", "une.cu")).toBe(true);
  });

  it("no coincide por subcadena", () => {
    expect(matchesDomainOrSubdomain("notune.cu", "une.cu")).toBe(false);
  });

  it("ignora el punto inicial del patrón", () => {
    expect(matchesDomainOrSubdomain("www.picta.cu", ".picta.cu")).toBe(true);
  });
});

describe("isNationalSite", () => {
  it("considera nacional cualquier sitio .cu", () => {
    expect(isNationalSite("www.picta.cu")).toBe(true);
    expect(isNationalSite("www.youtube.com")).toBe(false);
  });

  it("excluye los dominios institucionales configurados", () => {
    expect(isNationalSite("elecmtz.une.cu", ["une.cu"])).toBe(false);
    expect(isNationalSite("www.minem.cu", ["une.cu", "minem.cu"])).toBe(false);
  });

  it("no excluye dominios que solo comparten sufijo textual", () => {
    expect(isNationalSite("notune.cu", ["une.cu"])).toBe(true);
  });
});

describe("classifySite", () => {
  it("devuelve el alcance del sitio", () => {
    expect(classifySite("www.cubadebate.cu", ["une.cu"])).toBe("national");
    expect(classifySite("www.bing.com", ["une.cu"])).toBe("international");
  });
});

describe("isWebmailSite", () => {
  it("reconoce servidores de webmail de la lista", () => {
    const webmail = ["gmail.com", "outlook.com"];
    expect(isWebmailSite("mail.gmail.com", webmail)).toBe(true);
    expect(isWebmailSite("www.youtube.com", webmail)).toBe(false);
  });
});

describe("isInternalSite", () => {
  it("reconoce los rangos privados y reservados de IPv4", () => {
    expect(isInternalSite("172.19.152.80")).toBe(true);
    expect(isInternalSite("10.0.0.5")).toBe(true);
    expect(isInternalSite("192.168.1.1")).toBe(true);
    expect(isInternalSite("127.0.0.1")).toBe(true);
    expect(isInternalSite("169.254.1.1")).toBe(true);
    expect(isInternalSite("100.64.0.1")).toBe(true);
    expect(isInternalSite("0.1.0.1")).toBe(true);
  });

  it("reconoce las IPv6 internas", () => {
    expect(isInternalSite("[::1]")).toBe(true);
    expect(isInternalSite("fd00::1")).toBe(true);
    expect(isInternalSite("fe80::1")).toBe(true);
  });

  it("reconoce dominios y nombres internos", () => {
    expect(isInternalSite("update.services.local")).toBe(true);
    expect(isInternalSite("intranet.empresa.lan")).toBe(true);
    expect(isInternalSite("srvsiscont")).toBe(true);
  });

  it("no marca un destino público", () => {
    expect(isInternalSite("www.youtube.com")).toBe(false);
    expect(isInternalSite("149.154.175.50")).toBe(false);
    expect(isInternalSite("2001:db8::1")).toBe(false);
  });
});

describe("isTelemetrySite", () => {
  it("reconoce telemetría, publicidad, actualizaciones y certificados", () => {
    expect(isTelemetrySite("firefox-portal-detection.com")).toBe(true);
    expect(isTelemetrySite("6734a28b.otlp.bugsnag.com")).toBe(true);
    expect(isTelemetrySite("cp801.prod.do.dsp.mp.microsoft.com")).toBe(true);
    expect(isTelemetrySite("ad.doubleclick.net")).toBe(true);
    expect(isTelemetrySite("ctldl.windowsupdate.com")).toBe(true);
    expect(isTelemetrySite("ocsp.digicert.com")).toBe(true);
    expect(isTelemetrySite("www.google-analytics.com")).toBe(true);
  });

  it("no confunde un dominio parecido ni un sitio real", () => {
    expect(isTelemetrySite("notdoubleclick.net")).toBe(false);
    expect(isTelemetrySite("telemetry.vendor.com")).toBe(false);
    expect(isTelemetrySite("www.youtube.com")).toBe(false);
    expect(isTelemetrySite("gateway.facebook.com")).toBe(false);
  });

  it("acepta una lista propia en lugar de la de por defecto", () => {
    expect(isTelemetrySite("telemetry.vendor.com", ["vendor.com"])).toBe(true);
    expect(
      isTelemetrySite("firefox-portal-detection.com", ["vendor.com"]),
    ).toBe(false);
  });
});
