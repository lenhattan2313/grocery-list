import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CreateRecipeForm } from "@/types";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = (await req.json()) as CreateRecipeForm;

    // Check if recipe exists and user has access
    const existingRecipe = await prisma.recipe.findFirst({
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
    });

    if (!existingRecipe) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Delete existing ingredients and create new ones
    await prisma.recipeIngredient.deleteMany({
      where: {
        recipeId: params.id,
      },
    });

    const recipe = await prisma.recipe.update({
      where: {
        id: params.id,
      },
      data: {
        name: body.name,
        description: body.description,
        instructions: body.instructions,
        cookingTime: body.cookingTime,
        servings: body.servings,
        image: body.image,
        ingredients: {
          create: body.ingredients.map((ingredient) => ({
            name: ingredient.name,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
          })),
        },
      },
      include: {
        ingredients: true,
      },
    });

    return NextResponse.json(recipe);
  } catch (error) {
    console.error("[RECIPE_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if recipe exists and user has access
    const existingRecipe = await prisma.recipe.findFirst({
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
    });

    if (!existingRecipe) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Delete recipe and its ingredients (cascade delete should handle this)
    await prisma.recipe.delete({
      where: {
        id: params.id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[RECIPE_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
