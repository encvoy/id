import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  distDir: '../backend/views/widget',
  assetPrefix: '/widget/',
  trailingSlash: true,
  reactStrictMode: false,
  images: { unoptimized: true },
};

export default nextConfig;
