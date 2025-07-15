import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const UpdateItemSchema = z.object({
  name: z
    .string()
    .min(1, "Item name is required")
    .max(100, "Item name too long")
    .optional(),
  quantity: z.number().min(1, "Quantity must be at least 1").optional(),
  unit: z.string().max(20, "Unit too long").optional(),
  notes: z.string().max(500, "Notes too long").optional(),
  isCompleted: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const params = await context.params;
    const body = await request.json();
    const validatedData = UpdateItemSchema.parse(body);

    // Use transaction to update both item and potentially the list
    const result = await prisma.$transaction(async (tx) => {
      // Verify the item belongs to the user's list
      const item = await tx.shoppingItem.findFirst({
        where: {
          id: params.id,
        },
        include: {
          list: {
            select: {
              id: true,
              userId: true,
              isCompleted: true,
            },
          },
        },
      });

      if (!item || item.list.userId !== userId) {
        throw new Error("Item not found");
      }

      // Update the item
      await tx.shoppingItem.update({
        where: {
          id: params.id,
        },
        data: validatedData,
      });

      // If isCompleted status is being updated
      if (validatedData.isCompleted !== undefined) {
        let shouldUpdateList = false;
        let newListStatus = false;

        // If marking item as incomplete, immediately set list as incomplete
        if (!validatedData.isCompleted && item.list.isCompleted) {
          shouldUpdateList = true;
          newListStatus = false;
        }
        // If marking item as complete, check if all items are now complete
        else if (validatedData.isCompleted) {
          // Count total items in the list
          const totalItems = await tx.shoppingItem.count({
            where: {
              listId: item.list.id,
            },
          });

          // Count completed items (considering the current update)
          const completedItems = await tx.shoppingItem.count({
            where: {
              listId: item.list.id,
              OR: [
                // Count items that are already completed (excluding current item)
                {
                  isCompleted: true,
                  NOT: {
                    id: params.id,
                  },
                },
                // Include current item if it's being marked as completed
                {
                  id: params.id,
                  isCompleted: validatedData.isCompleted,
                },
              ],
            },
          });

          shouldUpdateList = totalItems === completedItems;
          newListStatus = shouldUpdateList;
        }

        // Update list status if needed
        if (shouldUpdateList || newListStatus !== item.list.isCompleted) {
          await tx.shoppingList.update({
            where: {
              id: item.list.id,
            },
            data: {
              isCompleted: newListStatus,
            },
          });
        }
      }

      // Return the updated item with its list
      return await tx.shoppingItem.findUnique({
        where: {
          id: params.id,
        },
        include: {
          list: true,
        },
      });
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.format() },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === "Item not found") {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    console.error("Error updating item:", error);
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
    // Verify the item belongs to the user's list
    const item = await prisma.shoppingItem.findFirst({
      where: {
        id: params.id,
      },
      include: {
        list: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!item || item.list.userId !== session.user.id) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    await prisma.shoppingItem.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("Error deleting item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
