// types/next-pwa.d.ts
declare module "next-pwa" {
  import type { NextConfig } from "next";

  interface PWAOptions {
    dest: string;
    disable?: boolean;
    register?: boolean;
    skipWaiting?: boolean;
    buildExcludes?: string[];
    fallbacks?: Record<string, string>;
    [key: string]: unknown;
  }

  function withPWA(
    pwaOptions: PWAOptions
  ): (nextConfig: NextConfig) => NextConfig;

  export = withPWA;
}
