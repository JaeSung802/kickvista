import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Internationalization handled via middleware + app/[locale] routing
  // No next/i18n config needed with App Router

  // Allow next/image to optimise team/league logos from API-Football CDN
  images: {
    formats: ["image/webp", "image/avif"],
    remotePatterns: [
      { protocol: "https", hostname: "media.api-sports.io" },
      { protocol: "https", hostname: "media-1.api-sports.io" },
      { protocol: "https", hostname: "media-2.api-sports.io" },
      { protocol: "https", hostname: "media-3.api-sports.io" },
      { protocol: "https", hostname: "v3.football.api-sports.io" },
    ],
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },

  // Redirects for backward compatibility
  async redirects() {
    return [
      {
        source: "/league/:slug",
        destination: "/ko/league/:slug",
        permanent: false,
      },
      {
        source: "/analysis",
        destination: "/ko/analysis",
        permanent: false,
      },
      // Redirect legacy opengraph-image routes (deleted files) to static OG image
      {
        source: "/:locale(ko|en)/opengraph-image",
        destination: "/og-default.png",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
