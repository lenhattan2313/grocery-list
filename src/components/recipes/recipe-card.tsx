"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RecipeWithIngredients } from "@/hooks/use-recipes-query";
import {
  ChefHat,
  Download,
  Eye,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  Upload,
  FileSpreadsheet,
  Heart,
} from "lucide-react";
import Image from "next/image";

interface RecipeCardProps {
  recipe: RecipeWithIngredients;
  onEdit?: (recipe: RecipeWithIngredients) => void;
  onDelete?: (recipe: RecipeWithIngredients) => void;
  onAddToList?: (recipe: RecipeWithIngredients) => void;
  onView?: (recipe: RecipeWithIngredients) => void;
  onImport?: () => void;
  onExport?: (recipe: RecipeWithIngredients) => void;
  onExportCSV?: (recipe: RecipeWithIngredients) => void;
  onToggleFavorite?: (recipeId: string) => void;
  isPriority?: boolean;
}

export function RecipeCard({
  recipe,
  onEdit,
  onDelete,
  onAddToList,
  onView,
  onImport,
  onExport,
  onExportCSV,
  onToggleFavorite,
  isPriority,
}: RecipeCardProps) {
  const handleExport = () => {
    if (!onExport) return;
    onExport(recipe);
  };

  const handleExportCSV = () => {
    if (!onExportCSV) return;
    onExportCSV(recipe);
  };

  const isFavorited = recipe.favoritedBy
    ? recipe.favoritedBy.length > 0
    : false;

  return (
    <Card className="w-full overflow-hidden gap-4 pt-0 relative">
      {/* Favorite button */}
      {onToggleFavorite && (
        <div className="absolute top-2 left-2 z-10">
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background/90 transition-colors ${
              isFavorited
                ? "text-red-500 hover:text-red-600"
                : "text-gray-400 hover:text-red-500"
            }`}
            onClick={() => onToggleFavorite(recipe.id)}
            aria-label={
              isFavorited ? "Remove from favorites" : "Add to favorites"
            }
          >
            <Heart className={`h-4 w-4 ${isFavorited ? "text-red-500" : ""}`} />
          </Button>
        </div>
      )}

      {/* More options dropdown */}
      <div className="absolute top-2 right-2 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background/90"
              aria-label="More options"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {onImport && (
              <DropdownMenuItem onClick={onImport} className="cursor-pointer">
                <Upload className="mr-2 h-4 w-4" />
                Import Recipe
              </DropdownMenuItem>
            )}
            {onExport && (
              <DropdownMenuItem
                onClick={handleExport}
                className="cursor-pointer"
              >
                <Download className="mr-2 h-4 w-4" />
                Export as JSON
              </DropdownMenuItem>
            )}
            {onExportCSV && (
              <DropdownMenuItem
                onClick={handleExportCSV}
                className="cursor-pointer"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export as CSV
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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
