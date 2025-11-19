import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    instrumentationHook: true,
  },
  // Disable Turbopack due to compatibility issues with Tailwind CSS v4
  turbo: undefined,
  // Enable standalone output for Docker builds
  output: 'standalone',
};

export default nextConfig;
