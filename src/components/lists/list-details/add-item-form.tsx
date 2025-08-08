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
import { Plus } from "lucide-react";
import { UNIT_OPTIONS } from "@/constants/unit";
import { CreateItemSchema } from "@/schema/item-schema";
import { VoiceInputButton } from "@/components/lists/voice-input-button";

interface AddItemFormProps {
  onAddItem: (data: z.infer<typeof CreateItemSchema>) => void;
  listId: string;
}

export function AddItemForm({ onAddItem }: AddItemFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(CreateItemSchema),
    defaultValues: {
      name: "",
      quantity: 1,
      unit: "pcs",
    },
  });

  const handleFormSubmit = (data: z.infer<typeof CreateItemSchema>) => {
    onAddItem(data);
    reset();
  };

  const handleVoiceItemsParsed = (
    items: Array<{ name: string; quantity: number; unit: string }>
  ) => {
    items.forEach((item) => {
      onAddItem({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
      });
    });
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="border rounded-lg p-4 dark:border-gray-600"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-gray-800 dark:text-gray-100">
            Add New Item
          </Label>
          <div className="flex items-center gap-2">
            <VoiceInputButton
              onItemsParsed={handleVoiceItemsParsed}
              disabled={false}
            />
            <Button
              type="submit"
              className="shrink-0"
              size="sm"
              aria-label="Add Item"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input placeholder="Item name" {...register("name")} />
            {errors.name && (
              <p className="text-xs text-destructive mt-1">
                {errors.name.message}
              </p>
            )}
          </div>
          <div className="w-16">
            <Input
              type="number"
              min="1"
              placeholder="Qty"
              {...register("quantity")}
            />
            {errors.quantity && (
              <p className="text-xs text-destructive mt-1">
                {errors.quantity.message}
              </p>
            )}
          </div>
          <div>
            <Controller
              name="unit"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger>
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
