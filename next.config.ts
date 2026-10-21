import type { NextConfig } from "next";

// "upgrade-insecure-requests" (CSP) y HSTS solo tienen sentido si la app se
// sirve por HTTPS. Sin un terminador TLS delante, el navegador reescribe los
// subrecursos (CSS/JS/fuentes) a https://, el handshake falla y la pagina se
// queda sin estilos ("secure connection failed"). Se activan solos cuando
// BETTER_AUTH_URL apunta a https://.
const useHttps = process.env.BETTER_AUTH_URL?.startsWith("https://") ?? false;

const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(useHttps ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(process.env.NODE_ENV === "production"
    ? [
        ...(useHttps
          ? [
              {
                key: "Strict-Transport-Security",
                value: "max-age=63072000",
              },
            ]
          : []),
        {
          key: "Content-Security-Policy",
          value: contentSecurityPolicy,
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["172.19.152.250", "localhost", "*.local"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
