import { useEffect } from "react";
import { useListsStore } from "@/stores/lists-store";
import { Button } from "@/components/ui/button";
import { dialogService } from "@/stores/dialog-store";
import { Recipe } from "@/types";
import { Loader2 } from "lucide-react";

interface RecipeToListFormProps {
  recipe: Recipe;
  onSubmit: (listId: string) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  error: string | null;
}

function RecipeToListForm({
  recipe,
  onSubmit,
  onCancel,
  isSubmitting,
  error,
}: RecipeToListFormProps) {
  const { lists, loading, error: listsError, fetchLists } = useListsStore();

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (listsError) {
    return (
      <div className="p-6">
        <p className="text-destructive">{listsError}</p>
        <Button onClick={fetchLists} variant="outline" className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      {error && <p className="text-destructive text-sm">{error}</p>}

      {lists.length === 0 ? (
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">No shopping lists found.</p>
          <Button onClick={() => dialogService.hideDialog("recipe-to-list")}>
            Create New List
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Choose a shopping list to add items from &quot;{recipe.name}&quot;:
          </p>
          <div className="grid gap-2">
            {lists.map((list) => (
              <Button
                key={list.id}
                variant="outline"
                className="w-full justify-start"
                disabled={isSubmitting}
                onClick={() => onSubmit(list.id)}
              >
                {list.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export function showRecipeToListDialog(
  recipe: Recipe,
  selectedIngredientIds?: string[]
) {
  let isSubmitting = false;

  const updateSubmittingState = (submitting: boolean) => {
    isSubmitting = submitting;
    dialogService.updateDialog("recipe-to-list", {
      content: (
        <RecipeToListForm
          recipe={recipe}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          error={null}
        />
      ),
    });
  };

  const handleSubmit = async (listId: string) => {
    updateSubmittingState(true);
    try {
      const response = await fetch(
        `/api/recipes/${recipe.id}/to-list/${listId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            selectedIngredientIds:
              selectedIngredientIds || recipe.ingredients.map((ing) => ing.id),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add recipe to list");
      }

      // Refresh the lists to get the updated items
      await useListsStore.getState().fetchLists();
      dialogService.hideDialog("recipe-to-list");
    } catch (error) {
      console.error("Failed to add recipe to list:", error);
      dialogService.updateDialog("recipe-to-list", {
        content: (
          <RecipeToListForm
            recipe={recipe}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={false}
            error={
              error instanceof Error
                ? error.message
                : "Failed to add recipe to list"
            }
          />
        ),
      });
    } finally {
      updateSubmittingState(false);
    }
  };

  const handleCancel = () => {
    dialogService.hideDialog("recipe-to-list");
  };

  dialogService.showDialog({
    id: "recipe-to-list",
    title: "Add to Shopping List",
    content: (
      <RecipeToListForm
        recipe={recipe}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
        error={null}
      />
    ),
    maxWidth: "sm",
  });
}
