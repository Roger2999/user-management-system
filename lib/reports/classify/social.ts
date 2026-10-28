import { matchesDomainOrSubdomain } from "./site";

/**
 * Catálogo de redes sociales del informe.
 *
 * La sección "Redes Sociales más utilizadas en la entidad" no es una lista de
 * sitios: es una red. Un usuario de Facebook reparte su tiempo entre
 * `facebook.com`, `www.facebook.com`, `gateway.facebook.com` y los CDN; sumar
 * solo el sitio principal deja fuera la mayor parte del tiempo. Por eso cada red
 * agrupa sus dominios y el motor suma el `Browsing Time` de todos ellos.
 *
 * **YouTube no está en la lista.** El informe de mayo titula la sección
 * "Facebook" aunque YouTube tiene más `Browsing Time` por usuario en ese mismo
 * mes (781,169 s contra 527,631 s): si YouTube entrara en el catálogo, el título
 * habría sido YouTube. Para este informe es una plataforma de video, no una red
 * social. Si el especialista decide incluirla, se agrega una entrada y se
 * regenera; no hay que tocar el motor.
 *
 * El orden importa: la primera red que coincide gana. Los dominios son
 * sufijos completos, no texto: `notfacebook.com` no es Facebook.
 */
export type SocialNetwork = {
  name: string;
  domains: readonly string[];
};

export const DEFAULT_SOCIAL_NETWORKS: readonly SocialNetwork[] = [
  {
    name: "Facebook",
    domains: ["facebook.com", "fbcdn.net", "fbsbx.com", "messenger.com", "m.me"],
  },
  {
    name: "Instagram",
    domains: ["instagram.com", "cdninstagram.com"],
  },
  {
    name: "WhatsApp",
    domains: ["whatsapp.com", "whatsapp.net", "wa.me"],
  },
  {
    name: "Telegram",
    domains: ["telegram.org", "t.me", "telegram.me", "tdesktop.com"],
  },
  {
    name: "TikTok",
    domains: ["tiktok.com", "tiktokcdn.com", "tiktokv.com"],
  },
  {
    name: "X",
    domains: ["twitter.com", "x.com", "twimg.com", "t.co"],
  },
  {
    name: "Snapchat",
    domains: ["snapchat.com", "sc-cdn.net"],
  },
  {
    name: "LinkedIn",
    domains: ["linkedin.com", "licdn.com"],
  },
  {
    name: "Pinterest",
    domains: ["pinterest.com", "pinimg.com"],
  },
  {
    name: "Reddit",
    domains: ["reddit.com", "redd.it", "redditmedia.com"],
  },
  {
    name: "Discord",
    domains: ["discord.com", "discordapp.com", "discord.gg"],
  },
];

/**
 * Red a la que pertenece un sitio, o `null` si no es una red del catálogo.
 *
 * Una conexión directa por IP —Telegram lo hace— no trae hostname y por eso no
 * se puede clasificar sin una tabla de rangos IP. Queda fuera en lugar de
 * adivinar.
 */
export function socialNetworkFor(
  site: string,
  networks: readonly SocialNetwork[] = DEFAULT_SOCIAL_NETWORKS,
): SocialNetwork | null {
  const normalized = site.trim().toLowerCase();
  if (normalized.length === 0) return null;

  for (const network of networks) {
    if (
      network.domains.some((domain) =>
        matchesDomainOrSubdomain(normalized, domain),
      )
    ) {
      return network;
    }
  }

  return null;
}
