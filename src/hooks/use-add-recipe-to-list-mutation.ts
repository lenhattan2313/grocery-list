import { addRecipeToListAsync } from "@/app/actions/recipes";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface AddRecipeToListPayload {
  recipeId: string;
  listId: string;
  selectedIngredientIds?: string[];
}

export function useAddRecipeToListMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      recipeId,
      listId,
      selectedIngredientIds,
    }: AddRecipeToListPayload) =>
      addRecipeToListAsync(recipeId, listId, selectedIngredientIds),
    onSuccess: () => {
      toast.success("Recipe added to list successfully!");
      return queryClient.invalidateQueries({ queryKey: ["lists"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add recipe to list.");
    },
  });
}
