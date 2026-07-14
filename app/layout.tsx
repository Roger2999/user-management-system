import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import NavMenu from "@/components/nav-menu/nav-menu";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sistema de Gestión de Usuarios",
  description: "Sistema de gestión de cuentas de usuario",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <header>
            <NavMenu />
          </header>
          <main className="flex-1 px-5">{children}</main>
          <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
            Sistema de Gestión de Usuarios
          </footer>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
