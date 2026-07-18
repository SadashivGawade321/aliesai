import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'AegisPay AI', template: '%s — AegisPay AI' },
  description: 'Programmable Trust for Every Transaction. AI-powered escrow and settlement infrastructure for real-time commerce.',
  keywords: ['fintech', 'escrow', 'payments', 'AI', 'settlement', 'fraud detection'],
  authors: [{ name: 'AegisPay AI' }],
  icons: { icon: '/favicon.ico' },
  openGraph: {
    title: 'AegisPay AI',
    description: 'Programmable Trust for Every Transaction',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#07070f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head />
      <body className={`${inter.variable} font-sans antialiased min-h-screen`}
        style={{ background: '#07070f', color: '#e2e8f0' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
