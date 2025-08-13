import { RecipeWithIngredients } from "@/hooks/use-recipes-query";
import { createDownloadableFile, sanitizeFilename } from "@/lib/file-download";

export interface ExportedRecipe {
  name: string;
  description?: string;
  instructions: string;
  cookingTime?: number;
  servings: number;
  image?: string;
  ingredients: {
    name: string;
    quantity: string;
    unit: string;
  }[];
}

/**
 * Converts recipe data to JSON format
 */
export function recipeToJSON(recipe: RecipeWithIngredients): string {
  const recipeData: ExportedRecipe = {
    name: recipe.name,
    description: recipe.description ?? undefined,
    instructions: recipe.instructions,
    cookingTime: recipe.cookingTime ?? undefined,
    servings: recipe.servings,
    image: recipe.image ?? undefined,
    ingredients: recipe.ingredients.map((ing) => ({
      name: ing.name,
      quantity: ing.quantity,
      unit: ing.unit,
    })),
  };

  return JSON.stringify(recipeData, null, 2);
}

/**
 * Converts recipe data to CSV format
 */
export function recipeToCSV(recipe: RecipeWithIngredients): string {
  const csvRows: string[][] = [];

  // Recipe header information
  csvRows.push(["Recipe Information"]);
  csvRows.push(["Name", recipe.name]);
  csvRows.push([]); // Empty row for spacing

  // Instructions
  csvRows.push(["Instructions"]);
  csvRows.push([recipe.instructions]);
  csvRows.push([]); // Empty row for spacing

  // Ingredients table
  csvRows.push(["Ingredients"]);
  csvRows.push(["Name", "Quantity", "Unit"]);
  recipe.ingredients.forEach((ingredient) => {
    csvRows.push([ingredient.name, ingredient.quantity, ingredient.unit]);
  });

  // Convert to CSV string with proper escaping
  return csvRows
    .map((row) =>
      row
        .map((cell) => {
          const escaped = cell.toString().replace(/"/g, '""');
          if (
            escaped.includes(",") ||
            escaped.includes('"') ||
            escaped.includes("\n")
          ) {
            return `"${escaped}"`;
          }
          return escaped;
        })
        .join(",")
    )
    .join("\n");
}

/**
 * Exports recipe as JSON file
 */
export function exportRecipeToJSON(recipe: RecipeWithIngredients): void {
  const jsonContent = recipeToJSON(recipe);
  const filename = `${sanitizeFilename(recipe.name)}.json`;
  createDownloadableFile(jsonContent, filename, "application/json");
}

/**
 * Exports recipe as CSV file
 */
export function exportRecipeToCSV(recipe: RecipeWithIngredients): void {
  const csvContent = recipeToCSV(recipe);
  const filename = `${sanitizeFilename(recipe.name)}.csv`;
  createDownloadableFile(csvContent, filename, "text/csv;charset=utf-8;");
}

// Re-export for backward compatibility
export { exportRecipeToJSON as exportRecipeToFile };
