import { describe, expect, it } from "vitest";
import { DEFAULT_SOCIAL_NETWORKS, socialNetworkFor } from "./social";

describe("socialNetworkFor", () => {
  it("agrupa el dominio y sus subdominios en la misma red", () => {
    expect(socialNetworkFor("facebook.com")?.name).toBe("Facebook");
    expect(socialNetworkFor("www.facebook.com")?.name).toBe("Facebook");
    expect(socialNetworkFor("gateway.facebook.com")?.name).toBe("Facebook");
    expect(socialNetworkFor("web.whatsapp.com")?.name).toBe("WhatsApp");
    expect(socialNetworkFor("web.telegram.org")?.name).toBe("Telegram");
  });

  it("no confunde un sufijo de texto con un dominio", () => {
    expect(socialNetworkFor("notfacebook.com")).toBeNull();
    expect(socialNetworkFor("facebook.com.evil.example")).toBeNull();
  });

  it("deja fuera YouTube a propósito", () => {
    expect(socialNetworkFor("www.youtube.com")).toBeNull();
    expect(socialNetworkFor("rr1---sn-x.googlevideo.com")).toBeNull();
  });

  it("no clasifica una conexión directa por IP", () => {
    expect(socialNetworkFor("149.154.175.50")).toBeNull();
  });

  it("distingue X de otros dominios con x", () => {
    expect(socialNetworkFor("x.com")?.name).toBe("X");
    expect(socialNetworkFor("www.google.com")).toBeNull();
  });

  it("no repite dominios entre redes", () => {
    const domains = DEFAULT_SOCIAL_NETWORKS.flatMap((network) =>
      network.domains.map((domain) => domain.toLowerCase()),
    );

    expect(new Set(domains).size).toBe(domains.length);
  });
});
