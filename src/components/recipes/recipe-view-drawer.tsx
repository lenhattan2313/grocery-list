"use client";

import { IngredientCheckbox } from "@/components/recipes/ingredient-checkbox";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { RecipeWithIngredients } from "@/hooks/use-recipes-query";
import Image from "next/image";
import { useState } from "react";

interface RecipeViewDrawerProps {
  recipe?: RecipeWithIngredients;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToList?: (recipe: RecipeWithIngredients) => void;
}

export function RecipeViewDrawer({
  recipe,
  open,
  onOpenChange,
  onAddToList,
}: RecipeViewDrawerProps) {
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(
    new Set()
  );

  if (!recipe) return null;

  const handleAddSelected = () => {
    if (!onAddToList) return;
    onAddToList({
      ...recipe,
      ingredients: recipe.ingredients.filter((ing) =>
        selectedIngredients.has(ing.id)
      ),
    });
  };

  const handleAddAll = () => {
    if (!onAddToList) return;
    onAddToList(recipe);
  };

  const handleIngredientToggle = (ingredientIds: string[]) => {
    setSelectedIngredients(new Set(ingredientIds));
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[95vh]">
        <div className="mx-auto w-full max-w-3xl">
          <DrawerHeader>
            <DrawerTitle className="text-2xl font-bold">
              {recipe.name}
            </DrawerTitle>
            {recipe.description && (
              <DrawerDescription>{recipe.description}</DrawerDescription>
            )}
          </DrawerHeader>

          <div className="px-6 pb-4 space-y-6">
            {recipe.image && (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                <Image
                  src={recipe.image}
                  alt={recipe.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  quality={90}
                  priority
                />
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Ingredients</h3>
              <IngredientCheckbox
                ingredients={recipe.ingredients}
                selectedIngredients={selectedIngredients}
                onChange={handleIngredientToggle}
              />
            </div>

            {recipe.instructions && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Instructions</h3>
                <div className="prose prose-sm max-w-none">
                  {recipe.instructions.split("\n").map((instruction, index) => (
                    <p key={index}>{instruction}</p>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DrawerFooter className="space-y-2">
            {onAddToList && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handleAddSelected}
                  disabled={selectedIngredients.size === 0}
                  aria-label="Add Selected Ingredients"
                >
                  Add Selected
                </Button>
                <Button
                  onClick={handleAddAll}
                  variant="outline"
                  aria-label="Add All Ingredients"
                >
                  Add All
                </Button>
              </div>
            )}
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
