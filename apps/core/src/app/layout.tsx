import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { LoadingOverlay } from "@repo/ui/loading-overlay";
import { ToastProvider } from "@repo/ui/toast";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Plataforma · Administración",
  description: "Portal de administración de la plataforma mayorista",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.variable} suppressHydrationWarning>
      <body>
        <ToastProvider>
          {children}
          <LoadingOverlay />
        </ToastProvider>
      </body>
    </html>
  );
}
