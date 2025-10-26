import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
        pathname: '/uploads/**'
      },
      {
        protocol: 'http',
        hostname: 'backend',
        port: '4000',
        pathname: '/uploads/**'
      }
    ]
  }
};

export default nextConfig;
