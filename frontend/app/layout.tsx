import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from 'next/link';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Porteiro Virtual IA - Admin",
  description: "Painel de Gestão do Porteiro Virtual",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <nav style={{ 
          backgroundColor: '#333', 
          color: 'white', 
          padding: '1rem 2rem',
          display: 'flex',
          gap: '2rem',
          alignItems: 'center'
        }}>
          <Link href="/" style={{ fontSize: '1.2rem', fontWeight: 'bold', textDecoration: 'none', color: 'white' }}>
            Porteiro IA
          </Link>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <Link href="/residents" style={{ textDecoration: 'none', color: '#ccc' }}>Moradores</Link>
            <Link href="/documents" style={{ textDecoration: 'none', color: '#ccc' }}>Documentos & RAG</Link>
            <Link href="/dashboard" style={{ textDecoration: 'none', color: '#ccc' }}>Dashboard</Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
