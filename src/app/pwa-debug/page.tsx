import { PWADebug } from "@/components/common/pwa-debug";

export default function PWADebugPage() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">PWA Debug</h1>
        <p className="text-muted-foreground">
          Debug PWA installation and configuration issues
        </p>
      </div>

      <div className="flex justify-center">
        <PWADebug />
      </div>

      <div className="text-xs text-muted-foreground space-y-2">
        <h3 className="font-semibold">Common PWA Issues:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>
            <strong>Not installing:</strong> Must use Safari on iOS, not Chrome
          </li>
          <li>
            <strong>Manifest not loading:</strong> Check if /manifest.json is
            accessible
          </li>
          <li>
            <strong>Service worker issues:</strong> Check browser console for
            errors
          </li>
          <li>
            <strong>HTTPS required:</strong> PWA requires HTTPS in production
          </li>
        </ul>

        <h3 className="font-semibold mt-4">Troubleshooting Steps:</h3>
        <ol className="list-decimal list-inside space-y-1">
          <li>Use the debug component above to check PWA status</li>
          <li>Click "Check Manifest" to verify manifest.json loads</li>
          <li>Click "Check Service Worker" to verify SW registration</li>
          <li>Check browser console for any error messages</li>
          <li>Ensure you're using Safari on iOS (not Chrome)</li>
          <li>Try refreshing the page and clearing browser cache</li>
        </ol>
      </div>
    </div>
  );
}
