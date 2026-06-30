const nextConfig = {
  output: "standalone",
  compress: true,
  poweredByHeader: false,
  deploymentId: process.env.RAILWAY_DEPLOYMENT_ID,
  compiler: {
    removeConsole: {
      exclude: ["error"],
    },
  },
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "192.168.1.17",
    "jbcl-frontend.jailbreakchangelogs.com",
  ],
  reactCompiler: {
    compilationMode: "annotation",
  },
  experimental: {
    optimizePackageImports: [
      "@mui/material",
      "@mui/lab",
      "@mui/x-date-pickers",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-navigation-menu",
      "@radix-ui/react-popover",
      "@radix-ui/react-slider",
      "@radix-ui/react-slot",
      "@radix-ui/react-switch",
      "@radix-ui/react-tabs",
      "lucide-react",
    ],
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
      {
        source: "/items",
        destination: "/values",
        permanent: false,
      },
      {
        source: "/values/suggestions",
        destination: "/items/suggestions",
        permanent: true,
      },
      {
        source: "/values/suggestions/:path*",
        destination: "/items/suggestions/:path*",
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
      {
        source: "/api/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow",
          },
        ],
      },
      {
        source: "/trading/ad/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow",
          },
        ],
      },
      {
        source: "/og/:path+",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow",
          },
        ],
      },
      {
        source: "/dupes/:path+",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow",
          },
        ],
      },
      {
        source: "/inventories/:path+",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow",
          },
        ],
      },
      {
        source: "/dupes/compare",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow",
          },
        ],
      },
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
        source: "/logos/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/assets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
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
