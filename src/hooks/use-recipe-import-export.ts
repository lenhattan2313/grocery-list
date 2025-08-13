import { useRef } from "react";
import { toast } from "sonner";
import { RecipeWithIngredients } from "@/hooks/use-recipes-query";
import { CreateRecipeForm } from "@/types";
import { exportRecipeToJSON, exportRecipeToCSV } from "@/lib/recipe-export";
import { processRecipeFile } from "@/lib/recipe-import";

interface UseRecipeImportExportProps {
  onImportRecipe: (recipe: CreateRecipeForm) => Promise<void>;
}

export function useRecipeImportExport({
  onImportRecipe,
}: UseRecipeImportExportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const importData = await processRecipeFile(file);
      await onImportRecipe(importData);
      toast.success("Recipe imported successfully!");
    } catch (error) {
      console.error("Import error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to import recipe. Please check the file format.";
      toast.error(errorMessage);
    } finally {
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleExport = (recipe: RecipeWithIngredients) => {
    try {
      exportRecipeToJSON(recipe);
      toast.success(`Recipe "${recipe.name}" exported successfully!`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export recipe. Please try again.");
    }
  };

  const handleExportCSV = (recipe: RecipeWithIngredients) => {
    try {
      exportRecipeToCSV(recipe);
      toast.success(`Recipe "${recipe.name}" exported to CSV successfully!`);
    } catch (error) {
      console.error("CSV export error:", error);
      toast.error("Failed to export recipe to CSV. Please try again.");
    }
  };

  return {
    fileInputRef,
    handleImport,
    handleFileImport,
    handleExport,
    handleExportCSV,
  };
}
