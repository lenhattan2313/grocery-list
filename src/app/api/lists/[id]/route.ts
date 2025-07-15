import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const UpdateListSchema = z.object({
  name: z
    .string()
    .min(1, "List name is required")
    .max(100, "List name too long")
    .optional(),
  isCompleted: z.boolean().optional(),
  updateItemsCompletion: z.boolean().optional(), // Flag to update all items when list completion changes
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const params = await context.params;
    const list = await prisma.shoppingList.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        items: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    return NextResponse.json(list);
  } catch (error) {
    console.error("Error fetching list:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const params = await context.params;
    const body = await request.json();
    const validatedData = UpdateListSchema.parse(body);

    const list = await prisma.shoppingList.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    // Use transaction to update both list and items atomically
    const updatedList = await prisma.$transaction(async (tx) => {
      // Update the list
      const { updateItemsCompletion, ...listData } = validatedData;
      const updatedList = await tx.shoppingList.update({
        where: {
          id: params.id,
        },
        data: listData,
        include: {
          items: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

      // If updateItemsCompletion is true and isCompleted is being updated,
      // update all items to match the list's completion status
      if (updateItemsCompletion && validatedData.isCompleted !== undefined) {
        await tx.shoppingItem.updateMany({
          where: {
            listId: params.id,
          },
          data: {
            isCompleted: validatedData.isCompleted,
          },
        });

        // Refetch the list with updated items
        return await tx.shoppingList.findUnique({
          where: {
            id: params.id,
          },
          include: {
            items: {
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        });
      }

      return updatedList;
    });

    return NextResponse.json(updatedList);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.format() },
        { status: 400 }
      );
    }

    console.error("Error updating list:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const params = await context.params;
    const list = await prisma.shoppingList.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    await prisma.shoppingList.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ message: "List deleted successfully" });
  } catch (error) {
    console.error("Error deleting list:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
