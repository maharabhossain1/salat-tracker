import bundleAnalyzer from '@next/bundle-analyzer';
import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
];

const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' });

const isDev = process.env.NODE_ENV !== 'production';
const isRunningDevCommand = process.argv.some(arg => arg.includes('dev'));
const shouldSkipCaching = isDev || isRunningDevCommand;

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: false },
  reactCompiler: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    minimumCacheTTL: 31536000,
  },
  async headers() {
    const headers = [
      // Security headers on every route — never include Cache-Control here
      // because dynamic/protected pages need no-store and static pages need
      // different TTLs. A single catch-all Cache-Control broke auth caching.
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];

    if (!shouldSkipCaching) {
      headers.push(
        // Static public assets — cache forever (content-addressed by Next.js)
        {
          source: '/fonts/:font*',
          headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
        },
        {
          source: '/images/:image*',
          headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
        },
        {
          source: '/icons/:path*',
          headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
        },
        // /_next/static omitted — Next.js adds immutable caching itself.
        //
        // Authenticated / dynamic pages must NEVER be cached by the browser
        // or CDN. A cached response bypasses middleware and serves stale data.
        {
          source: '/(|dashboard|setup)',
          headers: [{ key: 'Cache-Control', value: 'private, no-store' }],
        },
      );
    }

    // Auth API and service worker always bypass cache regardless of env.
    headers.push(
      {
        source: '/api/auth/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store' }],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    );

    return headers;
  },
  experimental: {
    serverMinification: true,
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
    optimizePackageImports: [
      'tailwindcss',
      '@radix-ui/react-accordion',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
    ],
  },
};

export default withBundleAnalyzer(nextConfig);
