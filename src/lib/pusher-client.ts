import PusherClient from "pusher-js";

import { config } from "@/config";

declare global {
  interface Window {
    pusherClientInstance: PusherClient | undefined;
  }
}

let pusherClientInstance: PusherClient | null = null;

// This function should be called on the client side only.
export function getPusherClient(): PusherClient {
  if (typeof window === "undefined") {
    // This is a safeguard, as `pusher-js` is intended for client-side use.
    // This will prevent the app from crashing during server-side rendering.
    return {} as PusherClient;
  }

  if (pusherClientInstance) {
    return pusherClientInstance;
  }

  const { key, cluster } = config.publicPusher;

  if (!key || !cluster) {
    console.error("Pusher key or cluster is not defined in the client.");
    // Depending on the desired behavior, you could throw an error
    // or return a mock/dummy object.
    return {} as PusherClient;
  }

  pusherClientInstance = new PusherClient(key, {
    cluster,
    authEndpoint: "/api/pusher/auth",
    authTransport: "ajax",
  });

  return pusherClientInstance;
}
