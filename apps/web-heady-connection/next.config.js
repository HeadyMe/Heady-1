/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@heady/ui'],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
