"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useRecipesStore } from "@/stores/recipes-store";
import { RecipeCard } from "@/components/recipes/recipe-card";
import { RecipeFormDrawer } from "@/components/recipes/recipe-form-drawer";
import { RecipeViewDrawer } from "@/components/recipes/recipe-view-drawer";
import { showRecipeToListDialog } from "@/components/recipes/recipe-to-list-dialog";
import { CreateRecipeForm, Recipe } from "@/types";
import { FloatingActionButton } from "@/components/common/floating-action-button";
import { PageHeader } from "@/components/common/page-header";
import { dialogService } from "@/stores/dialog-store";

export default function RecipesPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { recipes, isLoading, error, setRecipes, setLoading, setError } =
    useRecipesStore();

  // Filter recipes based on search query
  const filteredRecipes = recipes.filter((recipe) =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/recipes");
        if (!response.ok) throw new Error("Failed to fetch recipes");
        const data = await response.json();
        setRecipes(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch recipes"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [setRecipes, setLoading, setError]);

  const handleAddRecipe = async (data: CreateRecipeForm) => {
    try {
      setLoading(true);
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to create recipe");
      const newRecipe = await response.json();
      setRecipes([...recipes, newRecipe]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create recipe");
    } finally {
      setLoading(false);
    }
  };

  const handleEditRecipe = async (data: CreateRecipeForm) => {
    if (!selectedRecipe) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/recipes/${selectedRecipe.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to update recipe");
      const updatedRecipe = await response.json();
      setRecipes(
        recipes.map((r) => (r.id === selectedRecipe.id ? updatedRecipe : r))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update recipe");
    } finally {
      setLoading(false);
    }
  };
  const handleOpenDeleteDialog = (recipe: Recipe) => {
    dialogService.showConfirmDialog({
      id: `delete-recipe-${recipe.id}`,
      title: "Delete Recipe",
      content: (
        <div className="space-y-2">
          <p>
            Are you sure you want to delete &quot;<strong>{recipe.name}</strong>
            &quot;?
          </p>
          <p className="text-sm text-gray-600">
            This action cannot be undone. All items in this list will be
            permanently removed.
          </p>
        </div>
      ),
      confirmText: "Delete",
      confirmVariant: "destructive",
      onConfirm: () => {
        handleDeleteRecipe(recipe);
      },
    });
  };
  const handleDeleteRecipe = async (recipe: Recipe) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/recipes/${recipe.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete recipe");
      setRecipes(recipes.filter((r) => r.id !== recipe.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete recipe");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToList = async (recipe: Recipe) => {
    showRecipeToListDialog(
      recipe,
      recipe.ingredients.map((ing) => ing.id)
    );
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-destructive">Error: {error}</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Recipes" onSearch={setSearchQuery} className="mb-6" />

      {isLoading && recipes.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading recipes...</p>
        </div>
      ) : filteredRecipes.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">
            {searchQuery
              ? "No recipes found matching your search."
              : "No recipes yet. Add your first recipe!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onEdit={(recipe) => {
                setSelectedRecipe(recipe);
                setIsDrawerOpen(true);
              }}
              onDelete={handleOpenDeleteDialog}
              onAddToList={handleAddToList}
              onView={(recipe) => {
                setViewingRecipe(recipe);
                setIsViewDrawerOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <FloatingActionButton
        onClick={() => {
          setSelectedRecipe(null);
          setIsDrawerOpen(true);
        }}
        icon={Plus}
      />

      <RecipeFormDrawer
        mode={selectedRecipe ? "edit" : "add"}
        recipe={selectedRecipe || undefined}
        open={isDrawerOpen}
        onOpenChange={(open: boolean) => {
          setIsDrawerOpen(open);
          if (!open) setSelectedRecipe(null);
        }}
        onSubmit={selectedRecipe ? handleEditRecipe : handleAddRecipe}
      />

      <RecipeViewDrawer
        recipe={viewingRecipe || undefined}
        open={isViewDrawerOpen}
        onOpenChange={(open: boolean) => {
          setIsViewDrawerOpen(open);
          if (!open) setViewingRecipe(null);
        }}
        onAddToList={handleAddToList}
      />
    </div>
  );
}
