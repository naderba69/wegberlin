import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LearningProvider } from "@/components/learning-provider";
import { AppShell } from "@/components/app-shell";
import { PwaRegister } from "@/components/pwa-register";

export const metadata: Metadata = {
  title: { default: "الطريق إلى برلين", template: "%s | الطريق إلى برلين" },
  description: "مرشد ألماني شخصي للناطقين بالعربية من A1 إلى B2.",
  applicationName: "Der Weg nach Berlin",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#123f39",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl"><body tabIndex={-1}><LearningProvider><PwaRegister/><AppShell>{children}</AppShell></LearningProvider></body></html>;
}
