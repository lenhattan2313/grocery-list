import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const CreateItemSchema = z.object({
  name: z
    .string()
    .min(1, "Item name is required")
    .max(100, "Item name too long"),
  quantity: z.number().min(1, "Quantity must be at least 1").default(1),
  unit: z.string().max(20, "Unit too long").default("pcs"),
  notes: z.string().max(500, "Notes too long").optional(),
  listId: z.string().min(1, "List ID is required"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = CreateItemSchema.parse(body);

    // Verify the list belongs to the user
    const list = await prisma.shoppingList.findFirst({
      where: {
        id: validatedData.listId,
        userId: session.user.id,
      },
    });

    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    const newItem = await prisma.shoppingItem.create({
      data: {
        name: validatedData.name,
        quantity: validatedData.quantity,
        unit: validatedData.unit,
        notes: validatedData.notes,
        listId: validatedData.listId,
      },
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
