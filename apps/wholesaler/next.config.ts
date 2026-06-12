import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@repo/ui", "@repo/api"],
  reactStrictMode: true,
};

export default nextConfig;
