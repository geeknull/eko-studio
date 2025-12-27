import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['canvas', 'playwright', 'playwright-core', 'playwright-extra', 'puppeteer-extra-plugin-stealth', 'chromium-bidi', '@eko-ai/eko-nodejs'],
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  // Automatically set NEXT_PUBLIC_ENV for client-side access
  // On Vercel: uses VERCEL_ENV, locally: defaults to 'development'
  env: {
    NEXT_PUBLIC_ENV: process.env.VERCEL_ENV || 'development',
  },
};

export default nextConfig;
