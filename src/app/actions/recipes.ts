"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CreateRecipeForm } from "@/types";

export async function getRecipes() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const recipes = await prisma.recipe.findMany({
    where: {
      OR: [
        { userId: session.user.id },
        {
          household: {
            members: {
              some: {
                userId: session.user.id,
              },
            },
          },
        },
      ],
    },
    include: {
      ingredients: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return recipes;
}

export async function createRecipe(data: CreateRecipeForm) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { ingredients, ...recipeData } = data;

  const newRecipe = await prisma.recipe.create({
    data: {
      ...recipeData,
      userId: session.user.id,
      ingredients: {
        create: ingredients,
      },
    },
    include: {
      ingredients: true,
    },
  });

  return newRecipe;
}

export async function updateRecipe(id: string, data: CreateRecipeForm) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { ingredients, ...recipeData } = data;

  const updatedRecipe = await prisma.recipe.update({
    where: { id },
    data: {
      ...recipeData,
      ingredients: {
        deleteMany: {},
        create: ingredients,
      },
    },
    include: {
      ingredients: true,
    },
  });

  return updatedRecipe;
}

export async function deleteRecipe(id: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  await prisma.recipe.delete({
    where: { id },
  });
}

export async function addRecipeToListAsync(
  recipeId: string,
  listId: string,
  selectedIngredientIds?: string[]
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const recipe = await prisma.recipe.findFirst({
    where: {
      id: recipeId,
      OR: [
        { userId: session.user.id },
        {
          household: {
            members: {
              some: {
                userId: session.user.id,
              },
            },
          },
        },
      ],
    },
    include: {
      ingredients: true,
    },
  });

  if (!recipe) {
    throw new Error("Recipe not found");
  }

  const ingredientsToAdd = selectedIngredientIds
    ? recipe.ingredients.filter((ing) => selectedIngredientIds.includes(ing.id))
    : recipe.ingredients;

  const list = await prisma.shoppingList.findFirst({
    where: {
      id: listId,
      userId: session.user.id,
    },
  });

  if (!list) {
    throw new Error("List not found");
  }

  const updatedList = await prisma.shoppingList.update({
    where: {
      id: listId,
    },
    data: {
      items: {
        create: ingredientsToAdd.map((ingredient) => ({
          name: ingredient.name,
          quantity: parseInt(ingredient.quantity) || 1,
          unit: ingredient.unit,
          isCompleted: false,
        })),
      },
    },
    include: {
      items: true,
    },
  });

  return updatedList;
}
