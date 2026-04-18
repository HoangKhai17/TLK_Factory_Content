import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile workspace packages
  transpilePackages: ["@tlk/shared"],

  // Externalize native/heavy server-only modules (works with Turbopack & webpack)
  serverExternalPackages: [
    "better-sqlite3",
    "@remotion/renderer",
    "@remotion/bundler",
    "@remotion/cli",
  ],

  // Turbopack config (Next.js 16 default)
  turbopack: {},

  // Allow cross-origin dev access from local network (e.g. mobile preview)
  allowedDevOrigins: ["192.168.1.169"],

  // Allow serving rendered video outputs
  async headers() {
    return [
      {
        source: "/outputs/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
