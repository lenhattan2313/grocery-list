"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getPusherClient } from "@/lib/pusher-client";
import { ShoppingListWithItems } from "@/types/list";
import { useSession } from "next-auth/react";
import { useHouseholdQuery } from "./use-household-query";

export function useRealtimeLists() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { household } = useHouseholdQuery();

  useEffect(() => {
    if (!session?.user?.id || !household?.id) return;

    const pusherClient = getPusherClient();
    // Everyone in a household listens to the same channel
    const channelName = `private-household-${household.id}`;
    const channel = pusherClient.subscribe(channelName);

    const handleListUpdated = (updatedList: ShoppingListWithItems) => {
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
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          return newLists;
        }
      );
    };

    const handleListDeleted = (deletedList: { id: string }) => {
      queryClient.setQueryData(
        ["lists"],
        (oldLists: ShoppingListWithItems[] | undefined) =>
          oldLists?.filter((list) => list.id !== deletedList.id)
      );
    };

    channel.bind("list-updated", handleListUpdated);
    channel.bind("list-deleted", handleListDeleted);

    return () => {
      pusherClient.unsubscribe(channelName);
      pusherClient.unbind("list-updated", handleListUpdated);
      pusherClient.unbind("list-deleted", handleListDeleted);
    };
  }, [household?.id, session?.user?.id, queryClient]);
}
