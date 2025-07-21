"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { UNIT_OPTIONS } from "@/constants/unit";
import { itemSchema } from "@/schema/item-schema";

interface AddItemFormProps {
  onAddItem: (data: z.infer<typeof itemSchema>) => void;
  isAdding: boolean;
  listId: string;
}

export function AddItemForm({ onAddItem, isAdding }: AddItemFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: "",
      quantity: 1,
      unit: "pcs",
    },
  });

  const handleFormSubmit = (data: z.infer<typeof itemSchema>) => {
    onAddItem(data);
    reset();
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="border rounded-lg p-4 bg-gray-50"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Add New Item</Label>
          <Button
            type="submit"
            disabled={isAdding}
            className="shrink-0"
            size="sm"
            aria-label="Add Item"
          >
            {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
          </Button>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Item name"
              {...register("name")}
              disabled={isAdding}
              className="bg-white"
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>
          <div className="w-16">
            <Input
              type="number"
              min="1"
              placeholder="Qty"
              {...register("quantity")}
              disabled={isAdding}
              className="bg-white"
            />
            {errors.quantity && (
              <p className="text-xs text-red-500 mt-1">
                {errors.quantity.message}
              </p>
            )}
          </div>
          <div className="w-20">
            <Controller
              name="unit"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isAdding}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
      </div>
    </form>
  );
}
