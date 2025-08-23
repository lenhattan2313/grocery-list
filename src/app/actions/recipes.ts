"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CreateRecipeForm, RecipeIngredient } from "@/types";
import { revalidatePath } from "next/cache";

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
      favoritedBy: {
        where: {
          userId: session.user.id,
        },
      },
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

export async function deleteRecipe(id: string): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;

  try {
    await prisma.recipe.delete({
      where: { id },
    });
    return true;
  } catch {
    return false;
  }
}

export async function addRecipeToListAsync(
  recipeId: string,
  listId: string,
  selectedIngredientIds?: string[]
): Promise<{
  id: string;
  name: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unit: string;
    isCompleted: boolean;
  }>;
}> {
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

  const ingredientsToAdd: RecipeIngredient[] = selectedIngredientIds
    ? recipe.ingredients.filter((ingredient: RecipeIngredient): boolean =>
        selectedIngredientIds.includes(ingredient.id)
      )
    : recipe.ingredients;

  const list = await prisma.shoppingList.findFirst({
    where: {
      id: listId,
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
        create: ingredientsToAdd.map((ingredient: RecipeIngredient) => ({
          name: ingredient.name,
          quantity: Math.max(1, parseInt(ingredient.quantity) || 1),
          unit: ingredient.unit,
          isCompleted: false,
        })),
      },
    },
    include: {
      items: true,
    },
  });

  revalidatePath("/");
  return updatedList;
}

export async function toggleFavoriteRecipe(recipeId: string): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Check if recipe exists and user has access
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
  });

  if (!recipe) {
    throw new Error("Recipe not found");
  }

  // Check if already favorited
  const existingFavorite = await prisma.favoriteRecipe.findUnique({
    where: {
      userId_recipeId: {
        userId: session.user.id,
        recipeId: recipeId,
      },
    },
  });

  if (existingFavorite) {
    // Remove from favorites
    await prisma.favoriteRecipe.delete({
      where: {
        id: existingFavorite.id,
      },
    });
    return false;
  } else {
    // Add to favorites
    await prisma.favoriteRecipe.create({
      data: {
        userId: session.user.id,
        recipeId: recipeId,
      },
    });
    return true;
  }
}

export async function getFavoriteRecipes(): Promise<string[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  const favorites = await prisma.favoriteRecipe.findMany({
    where: {
      userId: session.user.id,
    },
    select: {
      recipeId: true,
    },
  });

  return favorites.map((favorite) => favorite.recipeId);
}
