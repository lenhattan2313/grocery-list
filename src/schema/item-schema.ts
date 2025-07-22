import { z } from "zod";

export const CreateItemSchema = z.object({
  name: z
    .string()
    .min(1, "Item name is required")
    .max(100, "Item name too long"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  unit: z.string(),
});

export const UpdateCreateItemSchema = z.object({
  name: z.string().min(1).max(100),
  quantity: z.number().min(1),
  unit: z.string(),
  isCompleted: z.boolean().optional(),
  notes: z.string().nullable().optional(),
});
export const UpdateListItemsSchema = z.array(UpdateCreateItemSchema);
