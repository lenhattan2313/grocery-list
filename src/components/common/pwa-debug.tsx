"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePWADetection } from "@/hooks/use-pwa-detection";
import { Download, Smartphone, Monitor } from "lucide-react";

export function PWADebug() {
  const { isPWA, isIOS, displayMode, isStandalone } = usePWADetection();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setCanInstall(false);
      }
    }
  };

  const checkManifest = async () => {
    try {
      const response = await fetch("/manifest.json");
      const manifest = await response.json();
      console.log("Manifest loaded:", manifest);
      return manifest;
    } catch (error) {
      console.error("Failed to load manifest:", error);
      return null;
    }
  };

  const checkServiceWorker = () => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        console.log("Service Worker registrations:", registrations);
      });
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          PWA Debug
        </CardTitle>
        <CardDescription>
          Debug PWA installation and configuration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* PWA Status */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <strong>PWA Mode:</strong>
            <Badge variant={isPWA ? "default" : "secondary"}>
              {isPWA ? "Yes" : "No"}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <strong>iOS Device:</strong>
            <Badge variant={isIOS ? "default" : "secondary"}>
              {isIOS ? "Yes" : "No"}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <strong>Display Mode:</strong>
            <Badge variant="outline">{displayMode || "unknown"}</Badge>
          </div>

          <div className="flex items-center gap-2">
            <strong>Standalone:</strong>
            <Badge variant={isStandalone ? "default" : "secondary"}>
              {isStandalone ? "Yes" : "No"}
            </Badge>
          </div>
        </div>

        {/* Installation */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <strong>Can Install:</strong>
            <Badge variant={canInstall ? "default" : "secondary"}>
              {canInstall ? "Yes" : "No"}
            </Badge>
          </div>

          {canInstall && (
            <Button onClick={handleInstallClick} size="sm" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Install PWA
            </Button>
          )}
        </div>

        {/* Debug Actions */}
        <div className="space-y-2">
          <Button
            onClick={checkManifest}
            variant="outline"
            size="sm"
            className="w-full"
          >
            Check Manifest
          </Button>

          <Button
            onClick={checkServiceWorker}
            variant="outline"
            size="sm"
            className="w-full"
          >
            Check Service Worker
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            <strong>To install PWA on iOS:</strong>
          </p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Open Safari (not Chrome)</li>
            <li>Go to your app URL</li>
            <li>Tap the share button (square with arrow)</li>
            <li>Select "Add to Home Screen"</li>
            <li>Tap "Add" to install</li>
          </ol>
        </div>

        {/* Environment Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            <strong>User Agent:</strong>
          </p>
          <p className="break-all">{navigator.userAgent}</p>
        </div>
      </CardContent>
    </Card>
  );
}
