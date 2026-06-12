import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@repo/ui", "@repo/api"],
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_USE_API: process.env.NEXT_PUBLIC_USE_API ?? "true",
  },
};

export default nextConfig;
