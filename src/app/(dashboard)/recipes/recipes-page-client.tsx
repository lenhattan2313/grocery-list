"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { RecipeCard } from "@/components/recipes/recipe-card";
import { showRecipeToListDialog } from "@/components/recipes/recipe-to-list-dialog";
import { CreateRecipeForm, RecipeIngredient } from "@/types";
import { FloatingActionButton } from "@/components/common/floating-action-button";
import { PageHeader } from "@/components/common/page-header";
import { dialogService } from "@/stores/dialog-store";
import { drawerService } from "@/stores/drawer-store";
import { RecipeFormDrawer } from "@/components/dynamic-imports";
import { RecipeViewDrawer } from "@/components/dynamic-imports";
import { PageHeaderSearch } from "@/components/common/page-header-search";
import {
  useRecipesQuery,
  useCreateRecipeMutation,
  useUpdateRecipeMutation,
  useDeleteRecipeMutation,
  useToggleFavoriteRecipeMutation,
  RecipeWithIngredients,
} from "@/hooks/use-recipes-query";
import { useRecipeImportExport } from "@/hooks/use-recipe-import-export";

interface RecipesPageClientProps {
  initialRecipes: RecipeWithIngredients[];
}

export default function RecipesPageClient({
  initialRecipes,
}: RecipesPageClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const {
    data: recipes = initialRecipes,
    isLoading,
    error,
  } = useRecipesQuery() as {
    data: RecipeWithIngredients[];
    isLoading: boolean;
    error: Error | null;
  };
  const createRecipeMutation = useCreateRecipeMutation();
  const updateRecipeMutation = useUpdateRecipeMutation();
  const deleteRecipeMutation = useDeleteRecipeMutation();
  const toggleFavoriteMutation = useToggleFavoriteRecipeMutation();

  const {
    fileInputRef,
    handleImport,
    handleFileImport,
    handleExport,
    handleExportCSV,
  } = useRecipeImportExport({
    onImportRecipe: async (recipe: CreateRecipeForm) => {
      await createRecipeMutation.mutateAsync(recipe);
    },
  });

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch = recipe.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFavoriteFilter =
      !showFavoritesOnly ||
      (recipe.favoritedBy && recipe.favoritedBy.length > 0);
    return matchesSearch && matchesFavoriteFilter;
  });

  const handleAddRecipe = async (data: CreateRecipeForm) => {
    await createRecipeMutation.mutateAsync(data);
  };

  const createEditRecipeHandler = (recipeId: string) => {
    return async (data: CreateRecipeForm) => {
      await updateRecipeMutation.mutateAsync({ id: recipeId, data });
    };
  };

  const handleOpenDeleteDialog = (recipe: RecipeWithIngredients) => {
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
        deleteRecipeMutation.mutate(recipe.id);
      },
    });
  };

  const handleAddToList = async (recipe: RecipeWithIngredients) => {
    showRecipeToListDialog(
      recipe,
      recipe.ingredients.map((ing: RecipeIngredient) => ing.id)
    );
  };

  const handleToggleFavorite = (recipeId: string) => {
    toggleFavoriteMutation.mutate(recipeId);
  };

  const handleFavoriteFilterToggle = () => {
    setShowFavoritesOnly(!showFavoritesOnly);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-destructive">Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileImport}
        className="hidden"
      />

      <PageHeader title="Recipes" className="mb-6">
        <PageHeaderSearch
          onSearch={setSearchQuery}
          showFavoriteFilter={true}
          isFavoriteFilterActive={showFavoritesOnly}
          onFavoriteFilterToggle={handleFavoriteFilterToggle}
        />
      </PageHeader>

      {isLoading && recipes.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading recipes...</p>
        </div>
      ) : filteredRecipes.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">
            {searchQuery || showFavoritesOnly
              ? "No recipes found matching your criteria."
              : "No recipes yet. Add your first recipe!"}
          </p>
        </div>
      ) : (
        <div
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 overflow-auto max-h-[calc(100vh-230px)] px-4 sm:px-6 lg:px-8 pb-16"
          style={{
            marginBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          {filteredRecipes.map((recipe, index) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              isPriority={index < 3}
              onEdit={(recipe) => {
                drawerService.showDrawer({
                  id: `recipe-form-edit-${recipe.id}`,
                  type: "recipe-form",
                  content: (
                    <RecipeFormDrawer
                      mode="edit"
                      recipe={recipe}
                      onSubmit={createEditRecipeHandler(recipe.id)}
                    />
                  ),
                });
              }}
              onDelete={handleOpenDeleteDialog}
              onAddToList={handleAddToList}
              onToggleFavorite={handleToggleFavorite}
              onView={(recipe) => {
                drawerService.showDrawer({
                  id: `recipe-view-${recipe.id}`,
                  type: "recipe-view",
                  content: (
                    <RecipeViewDrawer
                      recipe={recipe}
                      onAddToList={handleAddToList}
                    />
                  ),
                });
              }}
              onImport={handleImport}
              onExport={handleExport}
              onExportCSV={handleExportCSV}
            />
          ))}
        </div>
      )}

      <FloatingActionButton
        onClick={() => {
          drawerService.showDrawer({
            id: "recipe-form-add",
            type: "recipe-form",
            content: <RecipeFormDrawer mode="add" onSubmit={handleAddRecipe} />,
          });
        }}
        icon={Plus}
        ariaLabel="Add recipe"
      />
    </div>
  );
}
