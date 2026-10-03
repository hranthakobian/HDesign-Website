/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    rules: {}
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10gb'
    }
  }
};

export default nextConfig;