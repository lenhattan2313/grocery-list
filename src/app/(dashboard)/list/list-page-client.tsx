"use client";

import { useState, useCallback } from "react";
import { useSearchParamState } from "@/hooks/use-search-params";
import { useOfflineListsQuery } from "@/hooks/use-offline-lists";
import { ShoppingListCard } from "@/components/lists/shopping-list-card";
import { showAddListDialog } from "@/components/lists/add-list-dialog";
import { ListDetailsDrawer } from "@/components/lists/list-details-drawer";
import { Plus } from "lucide-react";
import { FloatingActionButton } from "@/components/common/floating-action-button";
import { PageSkeleton } from "@/components/common/page-skeleton";
import { useRealtimeLists } from "@/hooks/use-realtime-lists";
import { ShoppingListWithItems } from "@/types/list";
import { NetworkStatus } from "@/components/common/network-status";
import { ShoppingList } from "@/types";

interface ListsPageClientProps {
  initialLists: ShoppingListWithItems[];
}

export function ListsPageClient({ initialLists }: ListsPageClientProps) {
  const {
    data: lists = initialLists,
    isLoading,
    error,
    isError,
  } = useOfflineListsQuery(initialLists);
  const [searchQuery] = useSearchParamState("q", "");
  const [viewingListId, setViewingListId] = useState<string | null>(null);

  useRealtimeLists();

  const handleViewList = useCallback((listId: string) => {
    setViewingListId(listId);
  }, []);

  const filteredLists = lists.filter((list) =>
    list.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Find the selected list from the filtered lists
  const selectedList = viewingListId
    ? filteredLists.find((list) => list.id === viewingListId) || null
    : null;

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (isError && error) {
    return (
      <div className="text-center py-12 text-red-600">
        <p>Error loading lists: {error.message}</p>
      </div>
    );
  }

  return (
    <div>
      {filteredLists.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <Plus className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery
                ? "No matching lists found"
                : "No shopping lists yet"}
            </h3>
            <p className="text-gray-600 mb-6">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-auto max-h-[calc(100vh-230px)]">
          {filteredLists.map((list) => (
            <ShoppingListCard
              key={list.id}
              list={list}
              onViewList={handleViewList}
            />
          ))}
        </div>
      )}

      {/* Floating Add Button */}
      <FloatingActionButton
        onClick={showAddListDialog}
        icon={Plus}
        ariaLabel="Add list"
      />

      {/* List Details Drawer */}
      {selectedList && (
      <ListDetailsDrawer
        list={selectedList as ShoppingList}
        open={!!viewingListId}
          onOpenChange={(open) => !open && setViewingListId(null)}
        />
      )}

      {/* Network Status */}
      <NetworkStatus />
    </div>
  );
}
