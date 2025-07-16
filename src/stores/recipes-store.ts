import { create } from "zustand";
import { Recipe } from "@/types";

interface RecipesState {
  recipes: Recipe[];
  isLoading: boolean;
  error: string | null;
  setRecipes: (recipes: Recipe[]) => void;
  addRecipe: (recipe: Recipe) => void;
  updateRecipe: (id: string, recipe: Recipe) => void;
  deleteRecipe: (id: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useRecipesStore = create<RecipesState>((set) => ({
  recipes: [],
  isLoading: false,
  error: null,
  setRecipes: (recipes) => set({ recipes }),
  addRecipe: (recipe) =>
    set((state) => ({ recipes: [...state.recipes, recipe] })),
  updateRecipe: (id, updatedRecipe) =>
    set((state) => ({
      recipes: state.recipes.map((recipe) =>
        recipe.id === id ? updatedRecipe : recipe
      ),
    })),
  deleteRecipe: (id) =>
    set((state) => ({
      recipes: state.recipes.filter((recipe) => recipe.id !== id),
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
