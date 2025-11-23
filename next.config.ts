import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@eko-ai/eko', '@eko-ai/eko-nodejs', 'canvas'],
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
