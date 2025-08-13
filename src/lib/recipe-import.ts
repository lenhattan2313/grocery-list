import { CreateRecipeForm } from "@/types";

export interface ImportedRecipe {
  name: string;
  description?: string;
  instructions: string;
  cookingTime?: number;
  servings: number;
  image?: string;
  ingredients: ImportedIngredient[];
}

export interface ImportedIngredient {
  name: string;
  quantity: string;
  unit: string;
}

/**
 * Validates if the data structure matches expected recipe format
 */
export function validateImportedRecipe(data: unknown): data is ImportedRecipe {
  if (!data || typeof data !== "object") {
    return false;
  }

  const recipe = data as ImportedRecipe;

  // Check required fields
  if (!recipe.name || typeof recipe.name !== "string") {
    return false;
  }

  if (!recipe.instructions || typeof recipe.instructions !== "string") {
    return false;
  }

  if (!recipe.ingredients || !Array.isArray(recipe.ingredients)) {
    return false;
  }

  // Validate ingredients
  for (const ingredient of recipe.ingredients) {
    if (!ingredient.name || typeof ingredient.name !== "string") {
      return false;
    }
    if (!ingredient.quantity || typeof ingredient.quantity !== "string") {
      return false;
    }
    if (!ingredient.unit || typeof ingredient.unit !== "string") {
      return false;
    }
  }

  return true;
}

/**
 * Transforms imported recipe data to CreateRecipeForm format
 */
export function transformImportedRecipe(
  recipeData: ImportedRecipe
): CreateRecipeForm {
  return {
    name: recipeData.name,
    description: recipeData.description || "",
    instructions: recipeData.instructions,
    cookingTime: recipeData.cookingTime || undefined,
    servings: recipeData.servings || 4,
    image: recipeData.image || "",
    ingredients: recipeData.ingredients.map((ing: ImportedIngredient) => ({
      name: ing.name,
      quantity: ing.quantity,
      unit: ing.unit,
    })),
  };
}

/**
 * Parses JSON content and validates recipe structure
 */
export function parseRecipeJSON(jsonContent: string): CreateRecipeForm {
  try {
    const recipeData = JSON.parse(jsonContent);

    if (!validateImportedRecipe(recipeData)) {
      throw new Error("Invalid recipe format");
    }

    return transformImportedRecipe(recipeData);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("Invalid JSON format");
    }
    throw error;
  }
}

/**
 * Reads file content as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target?.result as string;
      resolve(text);
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsText(file);
  });
}

/**
 * Validates file type and size
 */
export function validateFile(file: File): void {
  // Check file type
  if (!file.name.toLowerCase().endsWith(".json")) {
    throw new Error("Only JSON files are supported");
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error("File size must be less than 5MB");
  }
}

/**
 * Processes imported recipe file
 */
export async function processRecipeFile(file: File): Promise<CreateRecipeForm> {
  // Validate file
  validateFile(file);

  // Read file content
  const fileContent = await readFileAsText(file);

  // Parse and validate recipe data
  return parseRecipeJSON(fileContent);
}

// Re-export for backward compatibility
export { processRecipeFile as parseImportedRecipe };
