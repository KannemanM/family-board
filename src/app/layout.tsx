import type { Metadata, Viewport } from "next";
import { Figtree, Fraunces } from "next/font/google";

import "./globals.css";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "FamilyBoard",
    template: "%s · FamilyBoard",
  },
  description: "El tablero de organización de la familia.",
  applicationName: "FamilyBoard",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#faf8f3",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${figtree.variable} ${fraunces.variable}`}>
      <body>{children}</body>
    </html>
  );
}
