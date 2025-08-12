import { CreateRecipeForm } from "@/types";

// Local storage key for draft recipe data
const DRAFT_RECIPE_KEY = "grocery-app-draft-recipe";

// Helper functions for localStorage
export const saveDraftRecipe = (data: CreateRecipeForm) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(DRAFT_RECIPE_KEY, JSON.stringify(data));
  }
};

export const loadDraftRecipe = (): CreateRecipeForm | null => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(DRAFT_RECIPE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Invalid JSON, remove it
        localStorage.removeItem(DRAFT_RECIPE_KEY);
      }
    }
  }
  return null;
};

export const clearDraftRecipe = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(DRAFT_RECIPE_KEY);
  }
};
