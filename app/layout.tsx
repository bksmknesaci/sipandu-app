import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppShell from '@/app/components/AppShell'; // ← Tambahan

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SIPANDU",
  description: "Sistem Informasi dan Penanganan Siswa Terpadu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <AppShell> {/* ← Bungkus children dengan AppShell */}
          {children}
        </AppShell>
      </body>
    </html>
  );
}