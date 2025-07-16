import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: { id: string; listId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get selected ingredient IDs from request body
    const { selectedIngredientIds } = await req.json();

    // Check if recipe exists and user has access
    const recipe = await prisma.recipe.findFirst({
      where: {
        id: params.id,
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
      return new NextResponse("Recipe not found", { status: 404 });
    }

    // Filter ingredients if selectedIngredientIds is provided
    const ingredientsToAdd = selectedIngredientIds
      ? recipe.ingredients.filter((ing) =>
          selectedIngredientIds.includes(ing.id)
        )
      : recipe.ingredients;

    // Check if list exists and user has access
    const list = await prisma.shoppingList.findFirst({
      where: {
        id: params.listId,
        userId: session.user.id,
      },
    });

    if (!list) {
      return new NextResponse("List not found", { status: 404 });
    }

    // Add recipe ingredients to the existing list
    const updatedList = await prisma.shoppingList.update({
      where: {
        id: params.listId,
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

    return NextResponse.json(updatedList);
  } catch (error) {
    console.error("[RECIPE_TO_LIST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
