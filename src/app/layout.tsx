import type { Metadata } from "next";
import { Geist_Mono, Inter, Poppins } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageProvider";
import FluidParticles from "@/components/FluidParticles";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Partikel — Detección de micropartículas con SAM3",
  description:
    "Sube una imagen de microscopía y detecta partículas, fibras y fragmentos con un workflow de Roboflow + SAM3.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${geistMono.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-ocean-night">
        <LanguageProvider>
          <FluidParticles className="pointer-events-none fixed inset-0 z-0" />
          <div className="relative z-10 flex min-h-dvh flex-col">{children}</div>
        </LanguageProvider>
      </body>
    </html>
  );
}
