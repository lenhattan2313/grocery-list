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
import { ChefHat, Eye, Pencil, Plus, Trash2 } from "lucide-react";
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
            variant="third"
            className="flex-1"
            onClick={() => onAddToList(recipe)}
            aria-label="Add to List"
          >
            <Plus className="h-4 w-4" />
            Add to List
          </Button>
        )}
        {onView && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => onView(recipe)}
            aria-label="View Recipe"
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}
        {onEdit && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => onEdit(recipe)}
            aria-label="Edit recipe"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
        {onDelete && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => onDelete(recipe)}
            className="text-destructive hover:text-destructive/80"
            aria-label="Delete recipe"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
