/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_HOST ?? 'http://localhost:5000'}/api/:path*`,
      },
    ]
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
    ],
  },
}

export default nextConfig
