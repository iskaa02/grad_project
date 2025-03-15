/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@electric-sql/pglite"],
  },
};

export default nextConfig;
