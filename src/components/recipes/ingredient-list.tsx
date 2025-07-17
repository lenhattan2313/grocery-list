"use client";

import { X } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
}

interface IngredientListProps {
  ingredients: Ingredient[];
  onChange: (ingredients: Ingredient[]) => void;
}

const UNITS = [
  "g",
  "kg",
  "ml",
  "l",
  "cup",
  "tbsp",
  "tsp",
  "oz",
  "lb",
  "piece",
  "slice",
  "whole",
] as const;

export function IngredientList({ ingredients, onChange }: IngredientListProps) {
  const { control } = useForm({
    defaultValues: {
      ingredients,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "ingredients",
    rules: { minLength: 1 },
  });

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

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-start gap-2">
            <Input
              placeholder="Ingredient name"
              value={ingredients[index]?.name || ""}
              onChange={(e) =>
                handleIngredientChange(index, "name", e.target.value)
              }
              className="flex-1"
            />
            <Input
              type="text"
              placeholder="Amount"
              value={ingredients[index]?.quantity || ""}
              onChange={(e) =>
                handleIngredientChange(index, "quantity", e.target.value)
              }
              className="w-20"
            />
            <Select
              value={ingredients[index]?.unit || ""}
              onValueChange={(value) =>
                handleIngredientChange(index, "unit", value)
              }
            >
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Unit" />
              </SelectTrigger>
              <SelectContent>
                {UNITS.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                const newIngredients = [...ingredients];
                newIngredients.splice(index, 1);
                onChange(newIngredients);
                remove(index);
              }}
              aria-label="Remove ingredient"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Remove ingredient</span>
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => {
          append({ name: "", quantity: "", unit: "" });
          onChange([...ingredients, { name: "", quantity: "", unit: "" }]);
        }}
      >
        Add Ingredient
      </Button>
    </div>
  );
}
