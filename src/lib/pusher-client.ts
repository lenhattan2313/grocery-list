import { config } from "@/config";

// Define Pusher types
interface PusherClient {
  subscribe: (channelName: string) => PusherChannel;
  unsubscribe: (channelName: string) => void;
  unbind: (eventName: string) => void;
}

interface PusherChannel {
  bind: (eventName: string, callback: (data: unknown) => void) => void;
  unbind: (eventName: string) => void;
}

declare global {
  interface Window {
    pusherClientInstance: PusherClient | undefined;
  }
}

let pusherClientInstance: PusherClient | null = null;
let pusherPromise: Promise<PusherClient> | null = null;

// Dynamic import function for Pusher - ensure it's truly dynamic
async function loadPusher(): Promise<PusherClient> {
  if (typeof window === "undefined") {
    return {} as PusherClient;
  }

  if (pusherPromise) {
    return pusherPromise;
  }

  const { key, cluster } = config.publicPusher;

  if (!key || !cluster) {
    return {} as PusherClient;
  }

  // Use dynamic import with explicit chunk name to ensure separation
  pusherPromise = import(/* webpackChunkName: "pusher" */ "pusher-js").then(
    (PusherClientModule) => {
      const client = new PusherClientModule.default(key, {
        cluster,
        authEndpoint: "/api/pusher/auth",
        authTransport: "ajax",
      });
      pusherClientInstance = client;
      return client;
    }
  );

  return pusherPromise;
}

// This function should be called on the client side only.
export async function getPusherClient(): Promise<PusherClient> {
  if (pusherClientInstance) {
    return pusherClientInstance;
  }

  return loadPusher();
}

// Synchronous version for backward compatibility (returns null if not loaded)
export function getPusherClientSync(): PusherClient | null {
  return pusherClientInstance;
}

// Preload Pusher when needed (call this when user is about to need real-time features)
export function preloadPusher(): void {
  if (typeof window !== "undefined" && !pusherPromise) {
    loadPusher();
  }
}
