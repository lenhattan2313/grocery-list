"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bell, AlertTriangle, CheckCircle } from "lucide-react";
import { PushNotificationService } from "@/lib/push-notification-service";

export default function PushTestPage() {
  const [status, setStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (info: string) => {
    setDebugInfo((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${info}`,
    ]);
  };

  const testPushNotification = async () => {
    setIsLoading(true);
    setStatus("Testing push notification...");
    setDebugInfo([]);

    try {
      addDebugInfo("Starting push notification test...");

      // Check if service worker is supported
      if (!("serviceWorker" in navigator)) {
        setStatus("Service Worker not supported in this browser");
        addDebugInfo("Service Worker not supported");
        return;
      }

      if (!("PushManager" in window)) {
        setStatus("Push Manager not supported in this browser");
        addDebugInfo("Push Manager not supported");
        return;
      }

      addDebugInfo("Service Worker and Push Manager supported");

      // Check current notification permission
      const currentPermission =
        "Notification" in window ? Notification.permission : "not-supported";
      addDebugInfo(`Current notification permission: ${currentPermission}`);

      // Request permission if needed
      const hasPermission = await PushNotificationService.requestPermission();
      addDebugInfo(`Permission request result: ${hasPermission}`);

      if (!hasPermission) {
        setStatus("Notification permission denied");
        addDebugInfo("Permission denied by user");
        return;
      }

      // Check service worker registration
      addDebugInfo("Checking service worker registration...");
      const registrations = await navigator.serviceWorker.getRegistrations();
      addDebugInfo(
        `Found ${registrations.length} service worker registrations`
      );

      if (registrations.length === 0) {
        addDebugInfo("No service worker registered, attempting to register...");
        await navigator.serviceWorker.register("/sw.js");
        addDebugInfo("Service worker registration initiated");
      }

      // Subscribe to push notifications
      addDebugInfo("Attempting to subscribe to push notifications...");
      const subscription =
        await PushNotificationService.subscribeToPushNotifications();

      if (!subscription) {
        setStatus("Failed to subscribe to push notifications");
        addDebugInfo("Subscription failed");
        return;
      }

      addDebugInfo("Successfully subscribed to push notifications");
      addDebugInfo(
        `Subscription endpoint: ${subscription.endpoint.substring(0, 50)}...`
      );

      // Send test notification
      addDebugInfo("Sending test notification via API...");
      const response = await fetch("/api/push/test", {
        method: "POST",
      });

      if (response.ok) {
        const result = await response.json();
        setStatus("Test notification sent! Check your Chrome notifications.");
        addDebugInfo("API call successful");
        addDebugInfo(`API response: ${JSON.stringify(result)}`);
      } else {
        const error = await response.text();
        setStatus("Failed to send test notification");
        addDebugInfo(
          `API call failed: ${response.status} ${response.statusText}`
        );
        addDebugInfo(`Error details: ${error}`);
      }
    } catch (error) {
      console.error("Test failed:", error);
      setStatus(
        "Test failed: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
      addDebugInfo(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const testManualNotification = async () => {
    setIsLoading(true);
    setStatus("Testing manual notification...");
    setDebugInfo([]);

    try {
      addDebugInfo("Testing manual browser notification...");

      // Check if notifications are supported
      if (!("Notification" in window)) {
        setStatus("Notifications not supported in this browser");
        addDebugInfo("Notification API not supported");
        return;
      }

      // Request permission
      const permission = await Notification.requestPermission();
      addDebugInfo(`Permission result: ${permission}`);

      if (permission !== "granted") {
        setStatus("Notification permission denied");
        addDebugInfo("Permission denied");
        return;
      }

      // Send a simple notification
      const notification = new Notification("Test Notification", {
        body: "This is a test notification from your grocery app!",
        icon: "/icon512_rounded.png",
        badge: "/icon512_rounded.png",
        tag: "test-notification",
      });

      addDebugInfo("Manual notification created");
      setStatus(
        "Manual notification sent! You should see it in the top-right corner."
      );

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
        addDebugInfo("Notification auto-closed");
      }, 5000);
    } catch (error) {
      console.error("Manual test failed:", error);
      setStatus(
        "Manual test failed: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
      addDebugInfo(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const testAggressiveNotification = async () => {
    setIsLoading(true);
    setStatus("Testing aggressive notification...");
    setDebugInfo([]);

    try {
      addDebugInfo("Testing aggressive notification method...");

      // Check if notifications are supported
      if (!("Notification" in window)) {
        setStatus("Notifications not supported in this browser");
        addDebugInfo("Notification API not supported");
        return;
      }

      // Force permission request
      const permission = await Notification.requestPermission();
      addDebugInfo(`Permission result: ${permission}`);

      if (permission !== "granted") {
        setStatus("Notification permission denied");
        addDebugInfo("Permission denied");
        return;
      }

      // Create multiple notifications to ensure one shows
      for (let i = 1; i <= 3; i++) {
        setTimeout(() => {
          const notification = new Notification(`Test Notification ${i}`, {
            body: `This is test notification ${i} from your grocery app!`,
            icon: "/icon512_rounded.png",
            badge: "/icon512_rounded.png",
            tag: `test-notification-${i}`,
            requireInteraction: true, // Keep notification until user interacts
            silent: true, // Play sound
          });

          addDebugInfo(`Created notification ${i}`);

          // Add click handler
          notification.onclick = () => {
            addDebugInfo(`Notification ${i} clicked`);
            notification.close();
          };

          // Auto-close after 10 seconds
          setTimeout(() => {
            notification.close();
            addDebugInfo(`Notification ${i} auto-closed`);
          }, 10000);
        }, i * 1000); // Send one every second
      }

      setStatus(
        "Sent 3 test notifications! Check your notification center and top-right corner."
      );
    } catch (error) {
      console.error("Aggressive test failed:", error);
      setStatus(
        "Aggressive test failed: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
      addDebugInfo(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const testSimpleNotification = async () => {
    setIsLoading(true);
    setStatus("Testing simple notification...");
    setDebugInfo([]);

    try {
      addDebugInfo("Testing simple browser notification...");

      // Check if notifications are supported
      if (!("Notification" in window)) {
        setStatus("Notifications not supported in this browser");
        addDebugInfo("Notification API not supported");
        return;
      }

      addDebugInfo("Notification API is supported");

      // Check current permission
      const currentPermission = Notification.permission;
      addDebugInfo(`Current permission: ${currentPermission}`);

      if (currentPermission === "default") {
        addDebugInfo("Requesting permission...");
        const permission = await Notification.requestPermission();
        addDebugInfo(`Permission result: ${permission}`);

        if (permission !== "granted") {
          setStatus("Permission denied by user");
          addDebugInfo("User denied permission");
          return;
        }
      } else if (currentPermission === "denied") {
        setStatus(
          "Notifications are blocked. Please enable them in Chrome settings."
        );
        addDebugInfo("Notifications are blocked");
        return;
      }

      addDebugInfo("Permission granted, creating notification...");

      // Create a very simple notification
      const notification = new Notification("Hello!", {
        body: "This is a test notification",
        icon: "/icon512_rounded.png",
      });

      addDebugInfo("Notification created");

      // Add event listeners
      notification.onclick = () => {
        addDebugInfo("Notification clicked");
        window.focus();
        notification.close();
      };

      notification.onshow = () => {
        addDebugInfo("Notification shown");
      };

      notification.onerror = (error) => {
        addDebugInfo(`Notification error: ${error}`);
      };

      notification.onclose = () => {
        addDebugInfo("Notification closed");
      };

      setStatus("Simple notification sent! Check if you see it.");

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
        addDebugInfo("Notification auto-closed");
      }, 5000);
    } catch (error) {
      console.error("Simple test failed:", error);
      setStatus(
        "Simple test failed: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
      addDebugInfo(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const checkNotificationSettings = () => {
    const permission =
      "Notification" in window ? Notification.permission : "not-supported";
    const serviceWorkerSupported = "serviceWorker" in navigator;
    const pushManagerSupported = "PushManager" in window;

    setDebugInfo([
      `Notification permission: ${permission}`,
      `Service Worker supported: ${serviceWorkerSupported}`,
      `Push Manager supported: ${pushManagerSupported}`,
      `Current URL: ${window.location.href}`,
      `Protocol: ${window.location.protocol}`,
    ]);
  };

  const checkChromeSettings = () => {
    const permission =
      "Notification" in window ? Notification.permission : "not-supported";
    const serviceWorkerSupported = "serviceWorker" in navigator;
    const pushManagerSupported = "PushManager" in window;
    const isLocalhost = window.location.hostname === "localhost";
    const isHttps = window.location.protocol === "https:";

    setDebugInfo([
      `=== Chrome Notification Settings ===`,
      `Notification permission: ${permission}`,
      `Service Worker supported: ${serviceWorkerSupported}`,
      `Push Manager supported: ${pushManagerSupported}`,
      `Current URL: ${window.location.href}`,
      `Protocol: ${window.location.protocol}`,
      `Hostname: ${window.location.hostname}`,
      `Is localhost: ${isLocalhost}`,
      `Is HTTPS: ${isHttps}`,
      ``,
      `=== Troubleshooting Steps ===`,
      `1. Go to: chrome://settings/content/notifications`,
      `2. Look for "localhost:3000" in the list`,
      `3. Make sure it's set to "Allow"`,
      `4. If not found, try allowing notifications again`,
      `5. Check if Chrome is in focus mode`,
      `6. Try switching to another app before testing`,
      ``,
      `=== macOS Settings ===`,
      `1. System Preferences → Notifications & Focus`,
      `2. Find "Google Chrome"`,
      `3. Make sure "Allow Notifications" is checked`,
      `4. Alert Style should be "Banners" or "Alerts"`,
      `5. Check if Focus mode is blocking notifications`,
    ]);
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <Card className="p-6 bg-black text-white border-gray-800">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
          <Bell className="h-6 w-6 text-white" />
          Push Notification Test
        </h1>

        <div className="space-y-4">
          <p className="text-sm text-gray-300">
            This page helps you test push notifications in Chrome. Make sure
            you&apos;re logged in and have enabled notifications.
          </p>

          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={testSimpleNotification}
              disabled={isLoading}
              className="bg-white text-black hover:bg-gray-200"
            >
              {isLoading ? "Testing..." : "Test Simple Notification"}
            </Button>

            <Button
              onClick={testManualNotification}
              disabled={isLoading}
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-black"
            >
              Test Manual Notification
            </Button>

            <Button
              onClick={testPushNotification}
              disabled={isLoading}
              className="border-white text-white hover:bg-white hover:text-black"
            >
              {isLoading ? "Testing..." : "Test Push Notification"}
            </Button>

            <Button
              onClick={testAggressiveNotification}
              disabled={isLoading}
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-black"
            >
              Test Aggressive (3 Notifications)
            </Button>

            <Button
              onClick={checkNotificationSettings}
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-black"
            >
              Check Settings
            </Button>

            <Button
              onClick={checkChromeSettings}
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-black"
            >
              Chrome Settings
            </Button>
          </div>

          {status && (
            <div
              className={`p-3 rounded-lg flex items-center gap-2 ${
                status.includes("sent") || status.includes("success")
                  ? "bg-green-900 border border-green-700 text-green-200"
                  : status.includes("failed") || status.includes("denied")
                  ? "bg-red-900 border border-red-700 text-red-200"
                  : "bg-blue-900 border border-blue-700 text-blue-200"
              }`}
            >
              {status.includes("sent") || status.includes("success") ? (
                <CheckCircle className="h-4 w-4 text-green-400" />
              ) : status.includes("failed") || status.includes("denied") ? (
                <AlertTriangle className="h-4 w-4 text-red-400" />
              ) : (
                <Bell className="h-4 w-4 text-blue-400" />
              )}
              <span className="text-sm">{status}</span>
            </div>
          )}

          {debugInfo.length > 0 && (
            <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
              <h3 className="text-sm font-medium mb-2 text-white">
                Debug Information:
              </h3>
              <div className="text-xs space-y-1 max-h-40 overflow-y-auto text-gray-300">
                {debugInfo.map((info, index) => (
                  <div key={index} className="font-mono">
                    {info}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs text-gray-400 space-y-1">
            <p>
              <strong>To test:</strong>
            </p>
            <p>1. Make sure you&apos;re logged in</p>
            <p>2. Allow notifications when prompted</p>
            <p>3. Click the test button</p>
            <p>4. Check for Chrome notification popup</p>
            <p>
              5. If no popup, check Chrome settings:
              chrome://settings/content/notifications
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
