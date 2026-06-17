import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import '@/app/globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'salat-tracker',
    template: `%s | salat-tracker`,
  },
  description: 'salat-tracker — built with next-op-cli',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
