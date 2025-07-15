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
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = UpdateItemSchema.parse(body);

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

    const updatedItem = await prisma.shoppingItem.update({
      where: {
        id: params.id,
      },
      data: validatedData,
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
