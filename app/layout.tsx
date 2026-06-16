import type { Metadata } from "next";
import { Big_Shoulders, Space_Mono, Archivo } from "next/font/google";
import "./globals.css";

const bigShoulders = Big_Shoulders({
  variable: "--font-big-shoulders",
  weight: ["600", "700", "800", "900"],
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  weight: ["400", "700"],
  subsets: ["latin"],
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "⚽ Mundial 2026 Tracker App",
  description: "No te pierdas ningún partido — USA · México · Canadá",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "⚽ Mundial 2026 Tracker App",
    description: "No te pierdas ningún partido — USA · México · Canadá",
    url: "https://mundial-2026-sepia-sigma.vercel.app",
    siteName: "Mundial 2026",
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "⚽ Mundial 2026 Tracker App",
    description: "No te pierdas ningún partido — USA · México · Canadá",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${bigShoulders.variable} ${spaceMono.variable} ${archivo.variable} h-full`}
    >
      <body className="min-h-full flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
