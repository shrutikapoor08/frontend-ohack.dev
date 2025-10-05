module.exports = {
  // Disable React Fast Refresh in development when supported.
  // Use the experimental flag `reactRefresh: false` which some Next.js
  // versions support. If your Next.js version doesn't support this,
  // remove or adjust accordingly.
  experimental: {
    reactRefresh: false,
  },
  // Enable production optimizations in development
  // This will help with more accurate performance testing
  productionBrowserSourceMaps: false,
  swcMinify: true,

  // Optimize bundle size
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Rewrites configuration
  async rewrites() {
    return [
      // Proxy API requests in development to avoid CORS issues when
      // running the frontend on localhost against the production API.
      {
        source: '/api/:path*',
        destination: 'https://api.ohack.dev/api/:path*',
      },
      {
        source: "/hack/:path*/sponsor",
        destination: "/sponsor",
      },
    ];
  },

  // Optimize images
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.giphy.com",
        port: "",
        pathname: "/media/**",
      },
      {
        protocol: "https",
        hostname: "i.imgur.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.squarespace-cdn.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars.slack-edge.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "secure.gravatar.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.ohack.dev",
        port: "",
        pathname: "/**",
      },
    ],
  },

  // Improve caching headers
  async headers() {
    return [
      {
        source: "/:all*(svg|jpg|png|webp|avif|gif|ico)",
        locale: false,
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/image/:path*",
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
            key: "Cache-Control",
            value: "public, max-age=3600, must-revalidate",
          },
        ],
      },
    ];
  },
};
