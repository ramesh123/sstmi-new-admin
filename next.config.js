/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Add this line for static export
  images: {
    domains: [process.env.NEXT_PUBLIC_S3_BUCKET_DOMAIN],
    unoptimized: true,
    remotePatterns: [
      {
        protocol: process.env.NEXT_IMAGES_REMOTE_PATTERN_PROTOCOL || 'https',
        hostname: '**',
      },
    ],
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  }
}

module.exports = nextConfig