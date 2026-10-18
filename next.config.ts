import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  // Client navigations reuse the last payload for 20s so Classes → Curriculum → Classes
  // does not wait on Tokyo again. Pages still refetch after that window, and a reload
  // always talks to Postgres.
  experimental: {
    staleTimes: {
      dynamic: 20,
      static: 180,
    },
  },
};

export default withNextIntl(nextConfig);
