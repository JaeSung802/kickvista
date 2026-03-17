import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Internationalization handled via middleware + app/[locale] routing
  // No next/i18n config needed with App Router

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
    ];
  },
};

export default nextConfig;
