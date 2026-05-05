const nextConfig = {
  compress: true,
  poweredByHeader: false,
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "jbcl-frontend.jailbreakchangelogs.com",
  ],
  reactCompiler: {
    compilationMode: "annotation",
  },
  experimental: {
    webpackMemoryOptimizations: true,
    optimizePackageImports: ["@mui/material", "radix-ui"],
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
    qualities: [75, 85, 90],
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
        protocol: "https",
        hostname: "assets.jailbreakchangelogs.com",
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
  async redirects() {
    return [
      {
        source: "/calculators/hyperchrome-pity",
        destination: "/hyperchrome-pity",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/apple-touch-icon.png",
        destination:
          "https://assets.jailbreakchangelogs.com/assets/logos/apple-touch-icon.png",
      },
    ];
  },
  async headers() {
    return [
      // Do not set global Cache-Control here — Next.js sets per-route headers (and
      // overriding `/_next/static` triggers a build warning). Rely on framework
      // defaults; use route handlers / segment config when you need no-store.
      {
        source: "/:path*",
        headers: [
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
      {
        source: "/users/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate",
          },
        ],
      },
      {
        source: "/settings",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate",
          },
        ],
      },
      {
        source: "/settings/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate",
          },
        ],
      },
	      {
	        source: "/:path*",
	        headers: [
	          {
	            key: "Content-Security-Policy",
	            value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none';",
	          },
	          {
	            key: "X-Frame-Options",
	            value: "DENY",
	          },
	        ],
	      },
    ];
  },
};

export default nextConfig;
