// next.config.ts
import withPWA from "next-pwa";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  /* config options here */
  // experimental: {
  //   ppr: "incremental",
  // },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default withPWA({
  dest: "public",
  disable: isDev,
  register: true,
  skipWaiting: true,
})(nextConfig);
