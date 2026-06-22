import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppShell from '@/app/components/AppShell';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SIPANDU",
  description: "Sistem Informasi dan Penanganan Siswa Terpadu",
  icons: {
    icon: "/logo-sipandu.png",
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