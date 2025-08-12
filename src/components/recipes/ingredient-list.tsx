"use client";

import { Plus, X } from "lucide-react";
import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UNIT_OPTIONS } from "@/constants/unit";

interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
}

interface IngredientListProps {
  ingredients: Ingredient[];
  onChange: (ingredients: Ingredient[]) => void;
}

export function IngredientList({
  ingredients = [],
  onChange,
}: IngredientListProps) {
  // Ref to track the last added input for focusing
  const lastAddedInputRef = useRef<HTMLInputElement>(null);

  // Focus on the last added input when ingredients length changes
  useEffect(() => {
    if (lastAddedInputRef.current && ingredients.length > 0) {
      lastAddedInputRef.current.focus();
    }
  }, [ingredients.length]);

  const handleIngredientChange = (
    index: number,
    field: keyof Ingredient,
    value: string
  ) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = {
      ...newIngredients[index],
      [field]: value,
    };
    onChange(newIngredients);
  };

  const handleAddIngredient = () => {
    const newIngredient = { name: "", quantity: "", unit: "g" };
    onChange([...ingredients, newIngredient]);
  };

  const handleRemoveIngredient = (index: number) => {
    const newIngredients = [...ingredients];
    newIngredients.splice(index, 1);
    onChange(newIngredients);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {ingredients.map((_, index) => (
          <div key={index} className="flex items-start gap-2">
            <Input
              ref={index === ingredients.length - 1 ? lastAddedInputRef : null}
              placeholder="Ingredient name"
              value={ingredients[index]?.name || ""}
              onChange={(e) =>
                handleIngredientChange(index, "name", e.target.value)
              }
              className="flex-1"
            />
            <Input
              type="number"
              placeholder="Amount"
              min={1}
              value={ingredients[index]?.quantity || ""}
              onChange={(e) =>
                handleIngredientChange(index, "quantity", e.target.value)
              }
              className="w-20"
            />
            <Select
              value={ingredients[index]?.unit || "g"}
              onValueChange={(value) =>
                handleIngredientChange(index, "unit", value)
              }
            >
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Unit" />
              </SelectTrigger>
              <SelectContent>
                {UNIT_OPTIONS.map((unit) => (
                  <SelectItem key={unit.value} value={unit.value}>
                    {unit.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleRemoveIngredient(index)}
              aria-label="Remove ingredient"
              className="text-destructive dark:text-destructive"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Remove ingredient</span>
            </Button>
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <Button
          type="button"
          variant="third"
          size="sm"
          className="w-fit"
          onClick={handleAddIngredient}
          aria-label="Add Ingredient"
        >
          <Plus className="h-4 w-4" />
          Add Ingredient
        </Button>
      </div>
    </div>
  );
}
