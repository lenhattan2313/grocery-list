"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RecipeWithIngredients } from "@/hooks/use-recipes-query";
import { ChefHat } from "lucide-react";
import Image from "next/image";

interface RecipeCardProps {
  recipe: RecipeWithIngredients;
  onEdit?: (recipe: RecipeWithIngredients) => void;
  onDelete?: (recipe: RecipeWithIngredients) => void;
  onAddToList?: (recipe: RecipeWithIngredients) => void;
  onView?: (recipe: RecipeWithIngredients) => void;
  isPriority?: boolean;
}

export function RecipeCard({
  recipe,
  onEdit,
  onDelete,
  onAddToList,
  onView,
  isPriority,
}: RecipeCardProps) {
  return (
    <Card className="w-full overflow-hidden gap-4 pt-0">
      {recipe.image ? (
        <div className="relative w-full aspect-[21/9]">
          <Image
            src={recipe.image}
            alt={recipe.name}
            fill
            className="object-cover rounded-t-lg"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            quality={80}
            priority={isPriority}
            loading={isPriority ? "eager" : "lazy"}
          />
        </div>
      ) : (
        <div className="relative w-full aspect-[21/9] bg-muted flex items-center justify-center rounded-t-lg">
          <ChefHat className="w-12 h-12 text-muted-foreground" />
        </div>
      )}
      <CardHeader>
        <CardTitle className="line-clamp-1">{recipe.name}</CardTitle>
        {recipe.description && (
          <CardDescription className="line-clamp-2">
            {recipe.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardFooter className="flex gap-2">
        {onAddToList && (
          <Button
            variant="default"
            className="flex-1"
            onClick={() => onAddToList(recipe)}
            aria-label="Add to List"
          >
            Add to List
          </Button>
        )}
        {onView && (
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onView(recipe)}
            aria-label="View Recipe"
          >
            View Recipe
          </Button>
        )}
        {onEdit && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => onEdit(recipe)}
            aria-label="Edit recipe"
          >
            <span className="sr-only">Edit recipe</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="m15 5 4 4" />
            </svg>
          </Button>
        )}
        {onDelete && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => onDelete(recipe)}
            className="text-red-600 hover:text-red-700"
            aria-label="Delete recipe"
          >
            <span className="sr-only">Delete recipe</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
