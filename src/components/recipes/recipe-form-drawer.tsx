"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { IngredientList } from "./ingredient-list";
import { CreateRecipeForm } from "@/types";
import { RecipeWithIngredients } from "@/hooks/use-recipes-query";
import { ImageToTextButton } from "@/components/recipes/image-to-text-button";
import Image from "next/image";
import ChatGptLogo from "@/assets/ChatGPT_logo.png";
import { useGenerateRecipeMutation } from "@/hooks/use-generate-recipe-mutation";

const recipeFormSchema = z.object({
  name: z.string().min(1, "Recipe name is required"),
  description: z.string().optional(),
  instructions: z.string().min(1, "Instructions are required"),
  cookingTime: z
    .number()
    .min(1, "Cooking time must be at least 1 minute")
    .optional(),
  servings: z.number().min(1, "Must serve at least 1 person"),
  image: z
    .string()
    .url("Must be a valid URL")
    .or(z.literal(""))
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  ingredients: z
    .array(
      z.object({
        name: z.string().min(1, "Ingredient name is required"),
        quantity: z.string().min(1, "Quantity is required"),
        unit: z.string().min(1, "Unit is required"),
      })
    )
    .min(1, "At least one ingredient is required"),
});

interface RecipeFormDrawerProps {
  mode: "add" | "edit";
  recipe?: RecipeWithIngredients;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateRecipeForm) => Promise<void>;
}
const defaultValues = {
  name: "",
  description: "",
  instructions: "",
  cookingTime: 15,
  servings: 1,
  image: "",
  ingredients: [],
};
export function RecipeFormDrawer({
  mode,
  recipe,
  open,
  onOpenChange,
  onSubmit,
}: RecipeFormDrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const { mutate: generateRecipe, isPending: isGenerating } =
    useGenerateRecipeMutation();

  const form = useForm<CreateRecipeForm>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues,
  });

  // Reset form when recipe changes in edit mode
  useEffect(() => {
    if (mode === "edit" && recipe) {
      form.reset({
        name: recipe.name,
        description: recipe.description || "",
        instructions: recipe.instructions,
        cookingTime: recipe.cookingTime ?? undefined,
        servings: recipe.servings,
        image: recipe.image ?? "",
        ingredients: recipe.ingredients.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          unit: i.unit,
        })),
      });
    }
  }, [recipe, form, mode]);

  // Reset form when opening in add mode
  useEffect(() => {
    if (mode === "add" && open) {
      form.reset(defaultValues);
    }
  }, [open, mode, form]);

  const handleGenerateRecipe = () => {
    if (!aiPrompt) return;
    form.reset(defaultValues);
    generateRecipe(aiPrompt, {
      onSuccess: (data) => {
        form.reset(data);
        setShowAIPrompt(false);
        setAiPrompt("");
      },
    });
  };

  const handleSubmit = async (data: CreateRecipeForm) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      if (mode === "add") {
        form.reset();
      }
      onOpenChange(false);
    } catch (error) {
      console.error(`Failed to ${mode} recipe:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[95vh]">
        <DrawerHeader className="border-b border-border">
          <div className="flex justify-between items-center">
            <DrawerTitle>
              {mode === "add" ? "Add New Recipe" : "Edit Recipe"}
            </DrawerTitle>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowAIPrompt(!showAIPrompt)}
              aria-label="Generate with AI"
              className="rounded-full animate-pulse-once"
            >
              <Image src={ChatGptLogo} alt="ChatGPT logo" className="h-4 w-4" />
            </Button>
          </div>
        </DrawerHeader>
        <div className="p-4 space-y-4 overflow-y-scroll">
          {showAIPrompt && (
            <div className="space-y-2">
              <Textarea
                placeholder="e.g., 'a healthy salmon recipe with asparagus'"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                autoFocus
              />
              <Button
                onClick={handleGenerateRecipe}
                disabled={isGenerating || !aiPrompt}
                className="w-full"
                isLoading={isGenerating}
              >
                Generate Recipe with AI
              </Button>
            </div>
          )}

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipe Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter recipe name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of the recipe"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cookingTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cooking Time (mins)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="30"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? parseInt(e.target.value)
                                : undefined
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="servings"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Servings</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="4"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/image.jpg"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ingredients"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ingredients</FormLabel>
                    <FormControl>
                      <IngredientList
                        ingredients={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instructions</FormLabel>
                    <div className="relative">
                      <Textarea
                        placeholder="Step by step cooking instructions"
                        className="min-h-[100px] pr-12"
                        {...field}
                      />
                      <ImageToTextButton
                        onTextExtracted={(text) =>
                          form.setValue("instructions", text, {
                            shouldValidate: true,
                          })
                        }
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        <DrawerFooter className="border-t border-border">
          <Button
            type="submit"
            disabled={isSubmitting}
            onClick={form.handleSubmit(handleSubmit)}
            aria-label={
              isSubmitting
                ? mode === "add"
                  ? "Creating recipe..."
                  : "Saving recipe..."
                : mode === "add"
                ? "Create recipe"
                : "Save recipe"
            }
          >
            {isSubmitting
              ? mode === "add"
                ? "Creating..."
                : "Saving..."
              : mode === "add"
              ? "Create Recipe"
              : "Save Changes"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
