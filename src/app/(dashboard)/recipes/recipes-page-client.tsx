"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { RecipeCard } from "@/components/recipes/recipe-card";
import { RecipeFormDrawer } from "@/components/dynamic-imports";
import { RecipeViewDrawer } from "@/components/dynamic-imports";
import { showRecipeToListDialog } from "@/components/recipes/recipe-to-list-dialog";
import { CreateRecipeForm, RecipeIngredient } from "@/types";
import { FloatingActionButton } from "@/components/common/floating-action-button";
import { PageHeader } from "@/components/common/page-header";
import { dialogService } from "@/stores/dialog-store";
import { PageHeaderSearch } from "@/components/common/page-header-search";
import {
  useRecipesQuery,
  useCreateRecipeMutation,
  useUpdateRecipeMutation,
  useDeleteRecipeMutation,
  RecipeWithIngredients,
} from "@/hooks/use-recipes-query";

interface RecipesPageClientProps {
  initialRecipes: RecipeWithIngredients[];
}

export default function RecipesPageClient({
  initialRecipes,
}: RecipesPageClientProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] =
    useState<RecipeWithIngredients | null>(null);
  const [viewingRecipe, setViewingRecipe] =
    useState<RecipeWithIngredients | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: recipes = initialRecipes,
    isLoading,
    error,
  } = useRecipesQuery();
  const createRecipeMutation = useCreateRecipeMutation();
  const updateRecipeMutation = useUpdateRecipeMutation();
  const deleteRecipeMutation = useDeleteRecipeMutation();

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddRecipe = async (data: CreateRecipeForm) => {
    await createRecipeMutation.mutateAsync(data);
  };

  const handleEditRecipe = async (data: CreateRecipeForm) => {
    if (!selectedRecipe) return;
    await updateRecipeMutation.mutateAsync({ id: selectedRecipe.id, data });
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

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-destructive">Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Recipes" className="mb-6">
        <PageHeaderSearch onSearch={setSearchQuery} />
      </PageHeader>

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
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 overflow-auto max-h-[calc(100vh-230px)]">
          {filteredRecipes.map((recipe, index) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              isPriority={index < 3}
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
        ariaLabel="Add recipe"
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
