import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <WifiOff className="mb-4 h-16 w-16 text-gray-500" />
      <h1 className="text-2xl font-bold">You are offline</h1>
      <p className="text-gray-600">
        Please check your internet connection and try again.
      </p>
    </div>
  );
}
