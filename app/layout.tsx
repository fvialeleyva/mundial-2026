import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "⚽ Mundial 2026",
  description: "Tracker de partidos del Mundial 2026 — USA · México · Canadá",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geist.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-espresso text-crema antialiased">
        {children}
      </body>
    </html>
  );
}
