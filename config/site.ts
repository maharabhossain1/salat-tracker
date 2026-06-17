export const siteConfig = {
  name: 'Salat Tracker',
  description: 'Track and make up your missed (kaza) prayers, one tap at a time.',
  url: process.env.NEXTAUTH_URL ?? 'http://localhost:3000',
  nav: [{ title: 'Dashboard', href: '/dashboard' }],
} as const;

export type SiteConfig = typeof siteConfig;
