"use client";

import { useEffect, useState } from "react";
import { useListsStore, ShoppingList } from "@/stores/lists-store";
import { ShoppingListCard } from "@/components/lists/shopping-list-card";
import { showAddListDialog } from "@/components/lists/add-list-dialog";
import { EditListDialog } from "@/components/lists/edit-list-dialog";
import { ListDetailsDrawer } from "@/components/lists/list-details-drawer";
import { Loader2, AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ListsPage() {
  const [editingList, setEditingList] = useState<ShoppingList | null>(null);
  const [viewingListId, setViewingListId] = useState<string | null>(null);
  const { lists, loading, error, fetchLists, clearError } = useListsStore();

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const handleEditList = (list: ShoppingList) => {
    setEditingList(list);
  };

  const handleViewList = (list: ShoppingList) => {
    setViewingListId(list.id);
  };

  const handleRetry = () => {
    clearError();
    fetchLists();
  };

  if (loading && lists.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Loading your shopping lists...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Shopping Lists</h2>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div className="flex-1">
              <p className="text-red-800 font-medium">Error loading lists</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              Try Again
            </Button>
          </div>
        </div>
      )}

      {lists.length === 0 && !loading && !error ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <Plus className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No shopping lists yet
            </h3>
            <p className="text-gray-600 mb-6">
              Get started by creating your first shopping list. Add items, track
              your progress, and never forget what you need to buy!
            </p>
            <p className="text-gray-500 text-sm">
              Click the + button in the bottom right to get started
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lists.map((list) => (
            <ShoppingListCard
              key={list.id}
              list={list}
              onEditList={handleEditList}
              onViewList={handleViewList}
            />
          ))}
        </div>
      )}

      {/* Floating Add Button */}
      <Button
        onClick={showAddListDialog}
        className="fixed bottom-20 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow z-10"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Edit List Dialog */}
      <EditListDialog
        list={editingList}
        open={!!editingList}
        onOpenChange={(open) => !open && setEditingList(null)}
      />

      {/* List Details Drawer */}
      <ListDetailsDrawer
        listId={viewingListId}
        open={!!viewingListId}
        onOpenChange={(open) => !open && setViewingListId(null)}
      />
    </div>
  );
}
