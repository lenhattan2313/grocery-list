"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  toggleFavoriteRecipe,
  getFavoriteRecipes,
} from "@/app/actions/recipes";
import { CreateRecipeForm } from "@/types";
import { Prisma } from "@prisma/client";

export const RECIPES_QUERY_KEY = "recipes";
export const FAVORITE_RECIPES_QUERY_KEY = "favorite-recipes";
export type RecipeWithIngredients = Prisma.RecipeGetPayload<{
  include: { ingredients: true; favoritedBy: true };
}>;

export function useRecipesQuery() {
  return useQuery<RecipeWithIngredients[], Error>({
    queryKey: [RECIPES_QUERY_KEY],
    queryFn: getRecipes,
  });
}

export function useFavoriteRecipesQuery() {
  return useQuery<string[], Error>({
    queryKey: [FAVORITE_RECIPES_QUERY_KEY],
    queryFn: getFavoriteRecipes,
  });
}

export function useToggleFavoriteRecipeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recipeId: string) => toggleFavoriteRecipe(recipeId),
    onMutate: async (recipeId: string) => {
      await queryClient.cancelQueries({ queryKey: [RECIPES_QUERY_KEY] });
      await queryClient.cancelQueries({
        queryKey: [FAVORITE_RECIPES_QUERY_KEY],
      });

      const previousRecipes = queryClient.getQueryData<RecipeWithIngredients[]>(
        [RECIPES_QUERY_KEY]
      );
      const previousFavorites = queryClient.getQueryData<string[]>([
        FAVORITE_RECIPES_QUERY_KEY,
      ]);

      // Optimistic update for recipes
      queryClient.setQueryData<RecipeWithIngredients[]>(
        [RECIPES_QUERY_KEY],
        (oldData = []) =>
          oldData.map((recipe) =>
            recipe.id === recipeId
              ? {
                  ...recipe,
                  favoritedBy:
                    recipe.favoritedBy.length > 0
                      ? []
                      : [
                          {
                            id: `optimistic-${Date.now()}`,
                            userId: "current-user",
                            recipeId,
                            createdAt: new Date(),
                          },
                        ],
                }
              : recipe
          )
      );

      // Optimistic update for favorites list
      queryClient.setQueryData<string[]>(
        [FAVORITE_RECIPES_QUERY_KEY],
        (oldData = []) => {
          const isCurrentlyFavorited = oldData.includes(recipeId);
          if (isCurrentlyFavorited) {
            return oldData.filter((id) => id !== recipeId);
          } else {
            return [...oldData, recipeId];
          }
        }
      );

      return { previousRecipes, previousFavorites };
    },
    onSuccess: () => {
      // Removed toast as requested
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousRecipes) {
        queryClient.setQueryData([RECIPES_QUERY_KEY], context.previousRecipes);
      }
      if (context?.previousFavorites) {
        queryClient.setQueryData(
          [FAVORITE_RECIPES_QUERY_KEY],
          context.previousFavorites
        );
      }
      toast.error(error.message || "Failed to update favorite status.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [RECIPES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [FAVORITE_RECIPES_QUERY_KEY] });
    },
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
        favoritedBy: [], // Empty array for new recipes
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
