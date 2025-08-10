"use client";

import { useState, useEffect } from "react";

interface PWADetectionState {
  isPWA: boolean;
  isIOS: boolean;
  isStandalone: boolean;
  displayMode: string | null;
}

export function usePWADetection(): PWADetectionState {
  const [state, setState] = useState<PWADetectionState>({
    isPWA: false,
    isIOS: false,
    isStandalone: false,
    displayMode: null,
  });

  useEffect(() => {
    const detectPWA = () => {
      // Check if we're in a PWA context
      const isStandalone =
        (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true;

      // Check display mode
      const displayModeQuery = window.matchMedia("(display-mode: standalone)");
      const displayMode = displayModeQuery.matches
        ? "standalone"
        : window.matchMedia("(display-mode: minimal-ui)").matches
        ? "minimal-ui"
        : window.matchMedia("(display-mode: fullscreen)").matches
        ? "fullscreen"
        : window.matchMedia("(display-mode: browser)").matches
        ? "browser"
        : null;

      // Check if it's iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

      // Determine if it's a PWA (either standalone mode or iOS standalone)
      const isPWA = displayModeQuery.matches || isStandalone;

      setState({
        isPWA,
        isIOS,
        isStandalone,
        displayMode,
      });
    };

    // Initial detection
    detectPWA();

    // Listen for changes in display mode
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleChange = () => detectPWA();

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return state;
}
