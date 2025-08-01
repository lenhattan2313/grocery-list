"use client";

import { useEffect } from "react";
import { preloadPusher } from "@/lib/pusher-client";
import { preloadSchemas } from "@/lib/dynamic-schemas";

export function Preloader() {
  useEffect(() => {
    // Preload heavy dependencies when user is authenticated
    // This happens after initial page load to improve performance

    const preloadHeavyDeps = async () => {
      try {
        // Preload Pusher for real-time features
        preloadPusher();

        // Preload Zod schemas for forms
        preloadSchemas();
      } catch {
        // Failed to preload dependencies
      }
    };

    // Delay preloading to prioritize initial page load
    const timer = setTimeout(preloadHeavyDeps, 2000);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
