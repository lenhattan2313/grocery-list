import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CreateRecipeForm } from "@/types";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

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

    return NextResponse.json(recipes);
  } catch (error) {
    console.error("[RECIPES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = (await req.json()) as CreateRecipeForm;

    const recipe = await prisma.recipe.create({
      data: {
        name: body.name,
        description: body.description,
        instructions: body.instructions,
        cookingTime: body.cookingTime,
        servings: body.servings,
        image: body.image,
        userId: session.user.id,
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
    console.error("[RECIPES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
