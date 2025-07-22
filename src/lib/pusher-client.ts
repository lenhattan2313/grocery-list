import PusherClient from "pusher-js";

declare global {
  interface Window {
    pusherClientInstance: PusherClient | undefined;
  }
}

// This function should be called on the client side only.
export function getPusherClient(): PusherClient {
  if (typeof window === "undefined") {
    // This is a safeguard, as `pusher-js` is intended for client-side use.
    // This will prevent the app from crashing during server-side rendering.
    return {} as PusherClient;
  }

  if (!window.pusherClientInstance) {
    window.pusherClientInstance = new PusherClient(
      process.env.NEXT_PUBLIC_PUSHER_KEY!,
      {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        authEndpoint: "/api/pusher/auth",
        authTransport: "ajax",
      }
    );
  }

  return window.pusherClientInstance;
}
