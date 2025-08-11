"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export function PWANavigationHandler() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if we're in standalone mode (PWA)
    const isStandalone =
      (window.navigator as Navigator & { standalone?: boolean }).standalone ||
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: window-controls-overlay)").matches;

    if (!isStandalone) {
      return; // Only handle PWA navigation
    }

    // Listen for PWA navigation events
    const handlePWANavigation = (event: CustomEvent) => {
      const { path } = event.detail;

      // Only navigate if the path is different from current and valid
      if (path && path !== pathname && path.startsWith("/")) {
        try {
          router.push(path);
        } catch (error) {
          console.error("PWA navigation error:", error);
          // Fallback to window.location if router fails
          window.location.href = path;
        }
      }
    };

    // Listen for popstate events (browser back/forward)
    const handlePopState = () => {
      const newPath = window.location.pathname;
      if (newPath !== pathname) {
        try {
          router.push(newPath);
        } catch (error) {
          console.error("PWA popstate navigation error:", error);
        }
      }
    };

    // Add event listeners
    window.addEventListener(
      "pwa-navigation",
      handlePWANavigation as EventListener
    );
    window.addEventListener("popstate", handlePopState);

    // Cleanup
    return () => {
      window.removeEventListener(
        "pwa-navigation",
        handlePWANavigation as EventListener
      );
      window.removeEventListener("popstate", handlePopState);
    };
  }, [router, pathname]);

  // This component doesn't render anything
  return null;
}
