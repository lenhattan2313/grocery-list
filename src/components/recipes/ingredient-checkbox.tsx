"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { RecipeIngredient } from "@/types";

interface IngredientCheckboxProps {
  ingredients: RecipeIngredient[];
  selectedIngredients: Set<string>;
  onChange: (ingredientIds: string[]) => void;
}

export function IngredientCheckbox({
  ingredients,
  selectedIngredients,
  onChange,
}: IngredientCheckboxProps) {
  const handleIngredientToggle = (ingredientId: string) => {
    const newSelected = new Set(selectedIngredients);
    if (newSelected.has(ingredientId)) {
      newSelected.delete(ingredientId);
    } else {
      newSelected.add(ingredientId);
    }
    onChange(Array.from(newSelected));
  };

  return (
    <div className="space-y-2">
      {ingredients.map((ingredient) => (
        <div key={ingredient.id} className="flex items-center gap-2">
          <Checkbox
            checked={selectedIngredients.has(ingredient.id)}
            onCheckedChange={() => handleIngredientToggle(ingredient.id)}
            id={`ingredient-${ingredient.id}`}
          />
          <label
            htmlFor={`ingredient-${ingredient.id}`}
            className="text-sm flex-1 cursor-pointer text-gray-800 dark:text-gray-100"
          >
            {ingredient.quantity} {ingredient.unit} {ingredient.name}
          </label>
        </div>
      ))}
    </div>
  );
}
