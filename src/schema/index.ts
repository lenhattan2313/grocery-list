// Centralized Zod schemas to reduce bundle size
import { z } from "zod";

// Item schemas
export const itemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Item name is required"),
  quantity: z.number().min(0, "Quantity must be at least 0"),
  unit: z.string().optional(),
  isCompleted: z.boolean().default(false),
  listId: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const addItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  quantity: z.number().min(0, "Quantity must be at least 0"),
  unit: z.string().optional(),
  listId: z.string(),
});

export const updateItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Item name is required").optional(),
  quantity: z.number().min(0, "Quantity must be at least 0").optional(),
  unit: z.string().optional(),
  isCompleted: z.boolean().optional(),
});

// Legacy schemas for backward compatibility
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

// List schemas
export const listSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "List name is required"),
  description: z.string().optional(),
  householdId: z.string(),
  isShared: z.boolean().default(false),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const createListSchema = z.object({
  name: z.string().min(1, "List name is required"),
  description: z.string().optional(),
  householdId: z.string(),
});

export const updateListSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "List name is required").optional(),
  description: z.string().optional(),
  isShared: z.boolean().optional(),
});

// Legacy list schema for backward compatibility
export const CreateListSchema = z.object({
  name: z
    .string()
    .min(1, "List name is required")
    .max(100, "List name too long"),
});

// Recipe schemas
export const recipeSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Recipe title is required"),
  description: z.string().optional(),
  ingredients: z
    .array(z.string())
    .min(1, "At least one ingredient is required"),
  instructions: z
    .array(z.string())
    .min(1, "At least one instruction is required"),
  prepTime: z.number().min(0).optional(),
  cookTime: z.number().min(0).optional(),
  servings: z.number().min(1).optional(),
  imageUrl: z.string().optional(),
  householdId: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const createRecipeSchema = z.object({
  title: z.string().min(1, "Recipe title is required"),
  description: z.string().optional(),
  ingredients: z
    .array(z.string())
    .min(1, "At least one ingredient is required"),
  instructions: z
    .array(z.string())
    .min(1, "At least one instruction is required"),
  prepTime: z.number().min(0).optional(),
  cookTime: z.number().min(0).optional(),
  servings: z.number().min(1).optional(),
  imageUrl: z.string().optional(),
  householdId: z.string(),
});

// Family member schemas
export const familyMemberSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
  householdId: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const addFamilyMemberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
  householdId: z.string(),
});

// Export types
export type Item = z.infer<typeof itemSchema>;
export type AddItem = z.infer<typeof addItemSchema>;
export type UpdateItem = z.infer<typeof updateItemSchema>;
export type List = z.infer<typeof listSchema>;
export type CreateList = z.infer<typeof createListSchema>;
export type UpdateList = z.infer<typeof updateListSchema>;
export type Recipe = z.infer<typeof recipeSchema>;
export type CreateRecipe = z.infer<typeof createRecipeSchema>;
export type FamilyMember = z.infer<typeof familyMemberSchema>;
export type AddFamilyMember = z.infer<typeof addFamilyMemberSchema>;
