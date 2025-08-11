"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export function PWANavigationHandler() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if we're in standalone mode (PWA)
    const isStandalone =
      (window.navigator && "standalone" in window.navigator
        ? window.navigator.standalone
        : false) ||
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: window-controls-overlay)").matches;

    if (!isStandalone) {
      return; // Only handle PWA navigation
    }

    // Store the current path to detect navigation changes
    let currentPath = window.location.pathname;

    // Handle link clicks for PWA navigation
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");

      // Only handle internal links
      if (
        link &&
        link.href &&
        link.href.startsWith(window.location.origin) &&
        !link.href.includes("#") && // Skip anchor links
        !link.hasAttribute("download") && // Skip download links
        !link.hasAttribute("target") && // Skip external links
        !link.classList.contains("external-link")
      ) {
        e.preventDefault();

        // Use history.pushState for client-side navigation
        const url = new URL(link.href);
        const path = url.pathname + url.search + url.hash;

        // Update the URL without full page reload
        window.history.pushState({}, "", path);

        // Use Next.js router for navigation
        if (url.pathname !== pathname) {
          try {
            router.push(url.pathname);
          } catch (error) {
            console.error("PWA navigation error:", error);
            // Fallback to window.location if router fails
            window.location.href = url.pathname;
          }
        }

        // Update current path
        currentPath = url.pathname;
      }
    };

    // Handle browser back/forward buttons
    const handlePopState = () => {
      const newPath = window.location.pathname;
      if (newPath !== currentPath) {
        try {
          router.push(newPath);
        } catch (error) {
          console.error("PWA popstate navigation error:", error);
        }
        currentPath = newPath;
      }
    };

    // Add event listeners
    document.addEventListener("click", handleLinkClick);
    window.addEventListener("popstate", handlePopState);

    // Cleanup
    return () => {
      document.removeEventListener("click", handleLinkClick);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [router, pathname]);

  // This component doesn't render anything
  return null;
}
