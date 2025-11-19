import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Enable standalone output for Docker builds
  output: 'standalone',
  
  // Disable static page generation for pages that use authentication
  experimental: {
    // Ensure client components work properly during build
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  // Configure which pages should be statically generated
  // Pages using auth/context should be dynamic
  typescript: {
    // Don't fail build on type errors (will be caught by CI)
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
