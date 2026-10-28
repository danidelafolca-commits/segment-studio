import type { Metadata, Viewport } from "next";
import { Fraunces, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageProvider";
import FluidParticles from "@/components/FluidParticles";
import SmoothScroll from "@/components/motion/SmoothScroll";
import IntroCurtain from "@/components/motion/IntroCurtain";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz", "SOFT", "WONK"],
});

export const metadata: Metadata = {
  title: "Partikel — Detectar lo invisible · Treball de Recerca",
  description:
    "Treball de Recerca de Quim Espigares Montes (Ins Fontanelles): detección y morfometría de micropartículas en imágenes de microscopía con Roboflow y SAM3.",
  authors: [{ name: "Quim Espigares Montes" }],
};

export const viewport: Viewport = {
  themeColor: "#f3eee4",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-paper text-ink">
        <LanguageProvider>
          <SmoothScroll />
          <IntroCurtain />
          <FluidParticles className="pointer-events-none fixed inset-0 z-0" />
          <div className="relative z-10 flex min-h-dvh flex-col">{children}</div>
          <div className="grain" aria-hidden="true" />
        </LanguageProvider>
      </body>
    </html>
  );
}
