"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getPusherClient } from "@/lib/pusher-client";
import { ShoppingListWithItems } from "@/types/list";
import { useSession } from "next-auth/react";
import { useHouseholdQuery } from "./use-household-query";

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

export function useRealtimeLists() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { household } = useHouseholdQuery();

  useEffect(() => {
    if (!session?.user?.id || !household?.id) return;

    let pusherClient: PusherClient;
    let channel: PusherChannel;
    let isSubscribed = false;

    const setupPusher = async () => {
      try {
        pusherClient = await getPusherClient();

        // Everyone in a household listens to the same channel
        const channelName = `private-household-${household.id}`;
        channel = pusherClient.subscribe(channelName);
        isSubscribed = true;

        const handleListUpdated = (data: unknown) => {
          const updatedList = data as ShoppingListWithItems;
          queryClient.setQueryData(
            ["lists"],
            (oldLists: ShoppingListWithItems[] = []) => {
              const listExists = oldLists.find((l) => l.id === updatedList.id);

              let newLists;
              if (listExists) {
                newLists = oldLists.map((l) =>
                  l.id === updatedList.id ? updatedList : l
                );
              } else {
                newLists = [...oldLists, updatedList];
              }

              // Keep the sort order consistent with the initial fetch
              newLists.sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              );

              return newLists;
            }
          );
        };

        const handleListDeleted = (data: unknown) => {
          const deletedList = data as { id: string };
          queryClient.setQueryData(
            ["lists"],
            (oldLists: ShoppingListWithItems[] | undefined) =>
              oldLists?.filter((list) => list.id !== deletedList.id)
          );
        };

        channel.bind("list-updated", handleListUpdated);
        channel.bind("list-deleted", handleListDeleted);
      } catch {
        // Failed to setup Pusher
      }
    };

    setupPusher();

    return () => {
      if (pusherClient && isSubscribed) {
        const channelName = `private-household-${household.id}`;
        pusherClient.unsubscribe(channelName);
        pusherClient.unbind("list-updated");
        pusherClient.unbind("list-deleted");
      }
    };
  }, [household?.id, session?.user?.id, queryClient]);
}
