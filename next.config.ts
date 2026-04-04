import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // These packages connect to Turso at runtime — do NOT bundle them.
  // Without this, webpack traces @libsql/client and crashes during build
  // when env vars are absent (createClient receives undefined URL).
  serverExternalPackages: ["@libsql/client", "@prisma/adapter-libsql"],
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
