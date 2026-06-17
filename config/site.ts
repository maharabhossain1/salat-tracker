export const siteConfig = {
  name: 'salat-tracker',
  description: 'salat-tracker — built with next-op-cli',
  url: process.env.NEXTAUTH_URL ?? 'http://localhost:3000',
  nav: [{ title: 'Dashboard', href: '/dashboard' }],
} as const;

export type SiteConfig = typeof siteConfig;
