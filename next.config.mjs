/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enabling additional features may help with Tailwind compatibility
    optimizeCss: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/v0/b/theaweshop.appspot.com/**',
      }
    ]
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};
export default nextConfig;

