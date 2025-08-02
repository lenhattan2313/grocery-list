/* eslint-disable @typescript-eslint/no-require-imports */
const {
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_BUILD,
} = require("next/constants");

/** @type {(phase: string, defaultConfig: import("next").NextConfig) => Promise<import("next").NextConfig>} */
module.exports = async (phase) => {
  /** @type {import("next").NextConfig} */
  const nextConfig = {
    // Performance optimizations
    compress: true,
    poweredByHeader: false,

    // Modern JavaScript targeting
    experimental: {
      optimizePackageImports: [
        "@radix-ui/react-dialog",
        "@radix-ui/react-dropdown-menu",
        "@radix-ui/react-select",
        "lucide-react",
        "date-fns",
        "sonner",
        "zod", // Optimize Zod imports
      ],
    },

    // Bundle optimization
    webpack: (config, { dev, isServer }) => {
      if (!dev && !isServer) {
        // Tree shaking optimization
        config.optimization.usedExports = true;
        config.optimization.sideEffects = false;

        // Minification optimization
        config.optimization.minimize = true;
        config.optimization.minimizer = config.optimization.minimizer || [];

        // Remove legacy JavaScript
        config.resolve.alias = {
          ...config.resolve.alias,
          // Ensure modern JavaScript features
          react: "react",
          "react-dom": "react-dom",
        };

        // Split chunks optimization - more aggressive splitting
        config.optimization.splitChunks = {
          chunks: "all",
          minSize: 10000, // Reduced from 20000
          maxSize: 200000, // Reduced from 244000
          cacheGroups: {
            // React and React DOM - separate chunks
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: "react",
              chunks: "all",
              priority: 40,
              enforce: true,
            },
            // Form libraries - separate chunk
            forms: {
              test: /[\\/]node_modules[\\/](@hookform|react-hook-form|@radix-ui[\\/]react-form)[\\/]/,
              name: "form-libraries",
              chunks: "async", // Load forms on demand
              priority: 35,
            },
            // Pusher - separate chunk for real-time features
            pusher: {
              test: /[\\/]node_modules[\\/]pusher-js[\\/]/,
              name: "pusher",
              chunks: "async", // Only load when needed
              priority: 30,
            },
            // Zod - separate chunk for validation (exclude locales)
            zod: {
              test: /[\\/]node_modules[\\/]zod[\\/]/,
              name: "zod",
              chunks: "async", // Only load when needed
              priority: 30,
            },
            // Query DevTools - development only
            queryDevtools: {
              test: /[\\/]node_modules[\\/]@tanstack[\\/]query-devtools[\\/]/,
              name: "query-devtools",
              chunks: "async",
              priority: 30,
              enforce: true,
            },
            // Radix UI components
            radix: {
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              name: "radix-ui",
              chunks: "async", // Load UI components on demand
              priority: 25,
            },
            // Lucide icons
            lucide: {
              test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
              name: "lucide",
              chunks: "async", // Load icons on demand
              priority: 25,
            },
            // AI/ML components (heaviest)
            ai: {
              test: /[\\/]components[\\/]recipes[\\/](image-crop-workflow|image-to-text-button)/,
              name: "ai-components",
              chunks: "async",
              priority: 30,
            },
            // Recipe components
            recipes: {
              test: /[\\/]components[\\/]recipes[\\/]/,
              name: "recipe-components",
              chunks: "async",
              priority: 25,
            },
            // List components
            lists: {
              test: /[\\/]components[\\/]lists[\\/]/,
              name: "list-components",
              chunks: "async",
              priority: 25,
            },
            // Common components
            common: {
              test: /[\\/]components[\\/]common[\\/]/,
              name: "common-components",
              chunks: "all",
              priority: 20,
            },
            // Default vendor chunk
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendors",
              chunks: "all",
              priority: 10,
            },
          },
        };

        // Remove unused exports
        config.optimization.providedExports = true;
        config.optimization.innerGraph = true;

        // Optimize Zod - exclude locales and ensure tree shaking
        config.module.rules.push({
          test: /[\\/]node_modules[\\/]zod[\\/]/,
          sideEffects: false,
        });

        // Exclude Zod locales from production build
        config.resolve.alias = {
          ...config.resolve.alias,
          // Exclude Zod locales to reduce bundle size
          "zod/lib/locale": false,
        };
      }

      // Bundle analyzer
      if (!isServer && process.env.ANALYZE === "true") {
        const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: "static",
            openAnalyzer: false,
            reportFilename: "./bundle-analysis.html",
            generateStatsFile: true,
            statsFilename: "./bundle-stats.json",
          })
        );
      }

      return config;
    },

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
      // Image optimization
      formats: ["image/webp", "image/avif"],
      minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    },

    // Optimize for modern browsers
    transpilePackages: [],
  };

  if (phase === PHASE_DEVELOPMENT_SERVER || phase === PHASE_PRODUCTION_BUILD) {
    const withSerwist = (await import("@serwist/next")).default({
      // Note: This is only an example. If you use Pages Router,
      // use something else that works, such as "service-worker/index.ts".
      swSrc: "src/app/sw.ts",
      swDest: "public/sw.js",
    });
    return withSerwist(nextConfig);
  }

  return nextConfig;
};
