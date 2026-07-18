import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppShell from '@/app/components/AppShell';

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
metadataBase: new URL("https://sipandu-nesaci.vercel.app"),
  title: "SIPANDU",
  description: "Sistem Informasi dan Penanganan Siswa Terpadu",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo-sipandu.png",
    apple: "/logo-sipandu.png",
  },
  openGraph: {
    title: "SIPANDU",
    description: "Sistem Informasi dan Penanganan Siswa Terpadu",
    url: "/",
    siteName: "SIPANDU",
images: [
  {
    url: "/logo-sipandu.png",
    width: 627,
    height: 632,
    alt: "SIPANDU - Sistem Informasi dan Penanganan Siswa Terpadu",
  },
],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "SIPANDU",
    description: "Sistem Informasi dan Penanganan Siswa Terpadu",
    images: ["/logo-sipandu.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}