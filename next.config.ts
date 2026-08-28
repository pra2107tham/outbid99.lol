import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The OG routes read these font files from disk at runtime, so they have to
  // be traced into the serverless bundle explicitly.
  outputFileTracingIncludes: {
    "/opengraph-image": ["./src/assets/**"],
    "/product/[slug]/opengraph-image": ["./src/assets/**"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
