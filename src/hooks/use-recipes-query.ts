"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
} from "@/app/actions/recipes";
import { CreateRecipeForm } from "@/types";
import { Prisma } from "@prisma/client";

export const RECIPES_QUERY_KEY = "recipes";
export type RecipeWithIngredients = Prisma.RecipeGetPayload<{
  include: { ingredients: true };
}>;
export function useRecipesQuery() {
  return useQuery<RecipeWithIngredients[], Error>({
    queryKey: [RECIPES_QUERY_KEY],
    queryFn: getRecipes,
  });
}

export function useCreateRecipeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRecipeForm) => createRecipe(data),
    onMutate: async (newRecipeData: CreateRecipeForm) => {
      await queryClient.cancelQueries({ queryKey: [RECIPES_QUERY_KEY] });

      const previousRecipes = queryClient.getQueryData<RecipeWithIngredients[]>(
        [RECIPES_QUERY_KEY]
      );

      const optimisticId = `optimistic-${Date.now()}`;
      const optimisticRecipe: RecipeWithIngredients = {
        id: optimisticId,
        name: newRecipeData.name,
        description: newRecipeData.description ?? null,
        instructions: newRecipeData.instructions,
        cookingTime: newRecipeData.cookingTime ?? null,
        servings: newRecipeData.servings,
        image: newRecipeData.image ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: "", // Will be replaced by server response
        householdId: "", // Will be replaced by server response
        ingredients: newRecipeData.ingredients.map((ing, index) => ({
          ...ing,
          id: `optimistic-ing-${optimisticId}-${index}`,
          recipeId: optimisticId,
        })),
      };

      queryClient.setQueryData<RecipeWithIngredients[]>(
        [RECIPES_QUERY_KEY],
        (oldData = []) => [...oldData, optimisticRecipe]
      );

      return { previousRecipes };
    },
    onSuccess: () => {
      toast.success("Recipe created successfully!");
    },
    onError: (error: Error, _, context) => {
      if (context?.previousRecipes) {
        queryClient.setQueryData([RECIPES_QUERY_KEY], context.previousRecipes);
      }
      toast.error(error.message || "Failed to create recipe.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [RECIPES_QUERY_KEY] });
    },
  });
}

export function useUpdateRecipeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateRecipeForm }) =>
      updateRecipe(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: [RECIPES_QUERY_KEY] });

      const previousRecipes = queryClient.getQueryData<RecipeWithIngredients[]>(
        [RECIPES_QUERY_KEY]
      );

      queryClient.setQueryData<RecipeWithIngredients[]>(
        [RECIPES_QUERY_KEY],
        (oldData = []) =>
          oldData.map((recipe) =>
            recipe.id === id
              ? {
                  ...recipe,
                  name: data.name,
                  description: data.description ?? null,
                  instructions: data.instructions,
                  cookingTime: data.cookingTime ?? null,
                  servings: data.servings,
                  image: data.image ?? null,
                  updatedAt: new Date(),
                  ingredients: data.ingredients.map((ing, index) => ({
                    ...ing,
                    id: `optimistic-ing-updated-${id}-${index}`,
                    recipeId: id,
                  })),
                }
              : recipe
          )
      );

      return { previousRecipes };
    },
    onSuccess: () => {
      toast.success("Recipe updated successfully!");
    },
    onError: (error: Error, _, context) => {
      if (context?.previousRecipes) {
        queryClient.setQueryData([RECIPES_QUERY_KEY], context.previousRecipes);
      }
      toast.error(error.message || "Failed to update recipe.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [RECIPES_QUERY_KEY] });
    },
  });
}

export function useDeleteRecipeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteRecipe(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: [RECIPES_QUERY_KEY] });

      const previousRecipes = queryClient.getQueryData<RecipeWithIngredients[]>(
        [RECIPES_QUERY_KEY]
      );

      queryClient.setQueryData<RecipeWithIngredients[]>(
        [RECIPES_QUERY_KEY],
        (oldData = []) => oldData.filter((recipe) => recipe.id !== id)
      );

      return { previousRecipes };
    },
    onSuccess: () => {
      toast.success("Recipe deleted successfully!");
    },
    onError: (error: Error, _, context) => {
      if (context?.previousRecipes) {
        queryClient.setQueryData([RECIPES_QUERY_KEY], context.previousRecipes);
      }
      toast.error(error.message || "Failed to delete recipe.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [RECIPES_QUERY_KEY] });
    },
  });
}
