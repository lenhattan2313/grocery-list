"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Download, Smartphone, Share, Plus } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if iOS
    const checkIOS = () => {
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
      setIsIOS(isIOSDevice);
    };

    // Check if already installed
    const checkIfInstalled = () => {
      // Check if running in standalone mode (PWA)
      const isStandalone =
        (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true;
      const displayModeQuery = window.matchMedia("(display-mode: standalone)");

      if (isStandalone || displayModeQuery.matches) {
        setIsInstalled(true);
        return;
      }

      // Check if running in fullscreen mode
      const fullscreenQuery = window.matchMedia("(display-mode: fullscreen)");
      if (fullscreenQuery.matches) {
        setIsInstalled(true);
        return;
      }
    };

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    // Check if already installed on mount
    checkIOS();
    checkIfInstalled();

    // Check if user previously dismissed the prompt
    const dismissed = localStorage.getItem("pwa-prompt-dismissed") === "true";
    setIsDismissed(dismissed);

    // Add event listeners
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Check periodically for installation status
    const interval = setInterval(checkIfInstalled, 1000);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
      clearInterval(interval);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      // Show the install prompt
      await deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        console.log("User accepted the install prompt");
        setIsInstalled(true);
        setShowPrompt(false);
      } else {
        console.log("User dismissed the install prompt");
      }
    } catch (error) {
      console.error("Error during PWA installation:", error);
    }

    // Clear the deferred prompt
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setIsDismissed(true);
    // Store in localStorage to remember user dismissed it
    localStorage.setItem("pwa-prompt-dismissed", "true");
  };

  const handleShowIOSInstructions = () => {
    setShowIOSInstructions(true);
  };

  const handleHideIOSInstructions = () => {
    setShowIOSInstructions(false);
    // Also dismiss the main prompt when user clicks "Got it"
    setShowPrompt(false);
    setIsDismissed(true);
    localStorage.setItem("pwa-prompt-dismissed", "true");
  };

  // Don't show if already installed or user dismissed it
  if (isInstalled || isDismissed) {
    return null;
  }

  // Show iOS instructions if user clicked "Install" on iOS
  if (showIOSInstructions) {
    return (
      <Card className="fixed bottom-4 left-4 right-4 z-50 p-4 bg-white dark:bg-gray-800 border-2 border-[var(--third)] shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Share className="h-6 w-6 text-[var(--third)]" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Install on iOS
            </h3>
            <div className="text-xs text-gray-600 dark:text-gray-300 space-y-2 mb-3">
              <p>
                1. Tap the <Share className="inline h-3 w-3" /> Share button in
                Safari
              </p>
              <p>2. Scroll down and tap &quot;Add to Home Screen&quot;</p>
              <p>3. Tap &quot;Add&quot; to install the app</p>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleHideIOSInstructions}
              className="text-gray-600 dark:text-gray-300"
            >
              Got it
            </Button>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            className="flex-shrink-0 h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    );
  }

  // Show main install prompt
  if (!showPrompt && !isIOS) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 p-4 bg-white dark:bg-gray-800 border-2 border-[var(--third)] shadow-lg">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Smartphone className="h-6 w-6 text-[var(--third)]" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Install Grocery App
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
            Install our app for a better experience with offline access and
            quick access from your home screen.
          </p>

          <div className="flex gap-2">
            {isIOS ? (
              <Button
                size="sm"
                onClick={handleShowIOSInstructions}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Install
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleInstall}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Install
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handleDismiss}
              className="text-gray-600 dark:text-gray-300"
            >
              Maybe Later
            </Button>
          </div>
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={handleDismiss}
          className="flex-shrink-0 h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
