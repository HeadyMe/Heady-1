/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@heady/ui', '@heady/core-domain'],
};

module.exports = nextConfig;
