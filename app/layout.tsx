import type { Metadata, Viewport } from 'next';
import { Inter, Jost, Lora } from 'next/font/google';

import '@/app/globals.css';
import { ServiceWorkerRegister } from '@/components/pwa/service-worker-register';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap',
  weight: ['500', '600', '700'],
});

const jost = Jost({
  subsets: ['latin'],
  variable: '--font-jost',
  display: 'swap',
  weight: ['300', '400', '500'],
});

export const metadata: Metadata = {
  applicationName: 'Salat Tracker',
  title: {
    default: 'Salat Tracker',
    template: `%s | Salat Tracker`,
  },
  description: 'Track and make up your missed (kaza) prayers, one tap at a time.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Salat',
  },
  icons: {
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png',
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0d5c43',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable} ${jost.variable} h-full`}>
      <body className="min-h-full">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
