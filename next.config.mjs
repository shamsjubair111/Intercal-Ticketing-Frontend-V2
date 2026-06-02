/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // 🚫 disable strict mode (stops double renders)
  output: 'standalone', // Enable standalone output for Docker
};

export default nextConfig;