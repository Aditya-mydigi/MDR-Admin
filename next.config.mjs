/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ✅ Moved out of experimental
  serverExternalPackages: ["jsonwebtoken"],

  // ✅ Explicitly set runtime
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  // Force Node.js runtime for APIs/middleware
  output: "standalone",
};

export default nextConfig;
