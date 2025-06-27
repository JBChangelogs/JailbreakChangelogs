/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        pathname: '/avatars/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.jailbreakchangelogs.xyz',
        pathname: '/assets/**',
      },
      {
        protocol: 'https',
        hostname: 'tr.rbxcdn.com',
        pathname: '/**/AvatarHeadshot/**',
      },
      {
        protocol: 'https',
        hostname: 'tr.rbxcdn.com',
        pathname: '/**/Avatar/**',
      },
      {
        protocol: 'https',
        hostname: 'tr.rbxcdn.com',
        pathname: '/**/AvatarBust/**',
      },
      {
        protocol: 'https',
        hostname: 'tr.rbxcdn.com',
        pathname: '/**/AvatarFullBody/**',
      }
    ],
  },
  async rewrites() {
    return [
      { source: '/apple-touch-icon.png', destination: 'https://assets.jailbreakchangelogs.xyz/assets/logos/apple-touch-icon.png' },
      { source: '/api/:path*', destination: '/api/:path*' }
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, must-revalidate'
          }
        ]
      },
      {
        source: '/users',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate'
          }
        ]
      }
    ]
  }
};

module.exports = nextConfig 