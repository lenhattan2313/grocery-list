import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

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
      return new NextResponse("Not Found", { status: 404 });
    }

    // Create a new shopping list from the recipe
    const shoppingList = await prisma.shoppingList.create({
      data: {
        name: `${recipe.name} Shopping List`,
        userId: session.user.id,
        householdId: recipe.householdId,
        items: {
          create: recipe.ingredients.map((ingredient) => ({
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

    return NextResponse.json(shoppingList);
  } catch (error) {
    console.error("[RECIPE_TO_LIST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
