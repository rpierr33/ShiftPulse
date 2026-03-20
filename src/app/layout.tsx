import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/providers/session-provider";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { InstallPrompt } from "@/components/pwa/install-prompt";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ShiftPulse - Workforce Timekeeping Platform",
  description: "Workforce timekeeping and shift management for nurse registries and staffing organizations",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ShiftPulse",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
      </head>
      <body className={`${inter.className} antialiased bg-gray-50`}>
        <ServiceWorkerRegister />
        <SessionProvider>
          {children}
          <InstallPrompt />
        </SessionProvider>
      </body>
    </html>
  );
}
