import { useListsQuery, ShoppingListWithItems } from "@/hooks/use-lists-query";
import { Button } from "@/components/ui/button";
import { dialogService } from "@/stores/dialog-store";
import { Loader2 } from "lucide-react";
import { RecipeWithIngredients } from "@/hooks/use-recipes-query";
import { useAddRecipeToListMutation } from "@/hooks/use-add-recipe-to-list-mutation";

interface RecipeToListFormProps {
  recipe: RecipeWithIngredients;
  onCancel: () => void;
  selectedIngredientIds?: string[];
}

function RecipeToListForm({
  recipe,
  onCancel,
  selectedIngredientIds,
}: RecipeToListFormProps) {
  const { data: lists, isLoading, isError, error, refetch } = useListsQuery();
  const { mutate: addRecipeToList, isPending } = useAddRecipeToListMutation();

  const handleSubmit = (listId: string) => {
    addRecipeToList(
      { recipeId: recipe.id, listId, selectedIngredientIds },
      {
        onSuccess: () => {
          dialogService.hideDialog("recipe-to-list");
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <p className="text-destructive">{error.message}</p>
        <Button
          onClick={() => refetch()}
          variant="outline"
          className="mt-4"
          aria-label="Retry"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      {!lists || lists.length === 0 ? (
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">No shopping lists found.</p>
          <Button
            onClick={() => dialogService.hideDialog("recipe-to-list")}
            aria-label="Create New List"
          >
            Create New List
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Choose a shopping list to add items from &quot;{recipe.name}&quot;:
          </p>
          <div className="grid gap-2">
            {lists.map((list: ShoppingListWithItems) => (
              <Button
                key={list.id}
                variant="outline"
                className="w-full justify-start"
                disabled={isPending}
                onClick={() => handleSubmit(list.id)}
                aria-label={`Add ${recipe.name} to ${list.name}`}
              >
                {list.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
          aria-label="Cancel"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

export function showRecipeToListDialog(
  recipe: RecipeWithIngredients,
  selectedIngredientIds?: string[]
) {
  const handleCancel = () => {
    dialogService.hideDialog("recipe-to-list");
  };

  dialogService.showDialog({
    id: "recipe-to-list",
    title: "Add to Shopping List",
    content: (
      <RecipeToListForm
        recipe={recipe}
        onCancel={handleCancel}
        selectedIngredientIds={selectedIngredientIds}
      />
    ),
    maxWidth: "sm",
  });
}
