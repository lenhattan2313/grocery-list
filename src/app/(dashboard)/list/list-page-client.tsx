"use client";

import { useSearchParamState } from "@/hooks/use-search-params";
import {
  useIndexedDBSync,
  useOfflineListsQuery,
} from "@/hooks/use-offline-lists";
import {
  AddListDialog,
  ListDetailsDrawer,
  ShoppingListCard,
} from "@/components/dynamic-imports";
import { Plus } from "lucide-react";
import { FloatingActionButton } from "@/components/common/floating-action-button";
// import { PageSkeleton } from "@/components/common/page-skeleton";
import { useRealtimeLists } from "@/hooks/use-realtime-lists";
import { NetworkStatus } from "@/components/common/network-status";

import { dialogService } from "@/stores/dialog-store";
import { useState, useCallback, useMemo } from "react";
import { ShoppingListWithItems } from "@/types/list";

export function ListsPageClient({
  initialLists,
}: {
  initialLists: ShoppingListWithItems[];
}) {
  const {
    data: lists = initialLists,
    // isLoading,
    error,
    isError,
  } = useOfflineListsQuery();
  const [searchQuery] = useSearchParamState("q", "");
  const [viewingListId, setViewingListId] = useState<string | null>(null);

  useIndexedDBSync();

  const RealtimeWrapper = () => {
    useRealtimeLists();
    return null;
  };
  const handleViewList = useCallback((listId: string) => {
    setViewingListId(listId);
  }, []);

  const handleAddList = useCallback(() => {
    dialogService.showDialog({
      id: "add-list",
      title: "Create a New Shopping List",
      content: <AddListDialog />,
      maxWidth: "md",
    });
  }, []);

  const filteredLists = useMemo(
    () =>
      lists.filter((list) =>
        list.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [lists, searchQuery]
  );

  // Find the selected list from the filtered lists
  const selectedList = viewingListId
    ? filteredLists.find((list) => list.id === viewingListId) || null
    : null;

  if (isError && error) {
    return (
      <div className="text-center py-12 text-red-600">
        <p>Error loading lists: {error.message}</p>
      </div>
    );
  }

  return (
    <div>
      {/* {isLoading && <PageSkeleton />} */}
      {filteredLists.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <Plus className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2 dark:text-gray-100">
              {searchQuery
                ? "No matching lists found"
                : "No shopping lists yet"}
            </h3>
            <p className="text-gray-600 mb-6 dark:text-gray-400">
              {searchQuery
                ? "Try adjusting your search terms or clear the search to see all lists."
                : "Get started by creating your first shopping list. Add items, track your progress, and never forget what you need to buy!"}
            </p>
            {!searchQuery && (
              <p className="text-gray-500 text-sm">
                Click the + button in the bottom right to get started
              </p>
            )}
          </div>
        </div>
      ) : (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-auto max-h-[calc(100vh-230px)] px-4 sm:px-6 lg:px-8"
          style={{
            marginBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          {filteredLists.map((list, index) => (
            <ShoppingListCard
              key={list.id}
              list={list}
              onViewList={handleViewList}
              index={index}
            />
          ))}
        </div>
      )}

      {/* Floating Add Button */}
      <FloatingActionButton
        onClick={handleAddList}
        icon={Plus}
        ariaLabel="Add list"
      />

      {/* List Details Drawer */}
      {selectedList && (
        <ListDetailsDrawer
          list={selectedList}
          open={!!viewingListId}
          onOpenChange={(open) => !open && setViewingListId(null)}
        />
      )}

      {/* Network Status */}
      <NetworkStatus />
      {filteredLists.length > 0 && <RealtimeWrapper />}
    </div>
  );
}
