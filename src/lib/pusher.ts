import Pusher from "pusher";
import { config } from "@/config";

let pusherInstance: Pusher | null = null;

export const getPusherInstance = () => {
  if (pusherInstance) {
    return pusherInstance;
  }

  const { appId, key, secret, cluster } = config.pusher;

  if (!appId || !key || !secret || !cluster) {
    throw new Error("Pusher configuration is incomplete.");
  }

  pusherInstance = new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS: true,
  });

  return pusherInstance;
};
