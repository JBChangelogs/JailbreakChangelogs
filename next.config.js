const nextConfig = {
  compress: true,
  poweredByHeader: false,
  allowedDevOrigins: ["127.0.0.1"],
  reactCompiler: {
    compilationMode: "annotation",
  },
  experimental: {
    webpackMemoryOptimizations: true,
    optimizePackageImports: ["@mui/material"],
  },
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    qualities: [75, 90],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
        pathname: "/avatars/**",
      },
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
        pathname: "/guild-tag-badges/**",
      },
      {
        protocol: "http",
        hostname: "proxy.jailbreakchangelogs.xyz",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "assets.jailbreakchangelogs.xyz",
        pathname: "/assets/**",
      },
      {
        protocol: "https",
        hostname: "tr.rbxcdn.com",
        pathname: "/**/AvatarHeadshot/**",
      },
      {
        protocol: "https",
        hostname: "tr.rbxcdn.com",
        pathname: "/**/Avatar/**",
      },
      {
        protocol: "https",
        hostname: "tr.rbxcdn.com",
        pathname: "/**/AvatarBust/**",
      },
      {
        protocol: "https",
        hostname: "tr.rbxcdn.com",
        pathname: "/**/AvatarFullBody/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/apple-touch-icon.png",
        destination:
          "https://assets.jailbreakchangelogs.xyz/assets/logos/apple-touch-icon.png",
      },
      { source: "/api/:path*", destination: "/api/:path*" },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=300, must-revalidate",
          },
          {
            key: "X-Built-By",
            value: "JailbreakChangelogs",
          },
        ],
      },
      {
        source: "/users",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
