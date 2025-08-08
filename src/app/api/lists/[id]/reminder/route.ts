import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reminderTime, reminderMessage } = await request.json();
    const { id } = await params;

    // Verify the list belongs to the user or their household
    const list = await prisma.shoppingList.findFirst({
      where: {
        id,
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
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    // Update the list with reminder
    const updatedList = await prisma.shoppingList.update({
      where: { id },
      data: {
        hasReminder: true,
        reminderTime: new Date(reminderTime),
        reminderMessage: reminderMessage || "Time to shop!",
      },
      include: {
        items: true,
        user: true,
        household: {
          include: {
            members: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedList);
  } catch (error) {
    console.error("Failed to set reminder:", error);
    return NextResponse.json(
      { error: "Failed to set reminder" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify the list belongs to the user or their household
    const list = await prisma.shoppingList.findFirst({
      where: {
        id,
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
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    // Remove reminder from the list
    const updatedList = await prisma.shoppingList.update({
      where: { id },
      data: {
        hasReminder: false,
        reminderTime: null,
        reminderMessage: null,
      },
      include: {
        items: true,
        user: true,
        household: {
          include: {
            members: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedList);
  } catch (error) {
    console.error("Failed to remove reminder:", error);
    return NextResponse.json(
      { error: "Failed to remove reminder" },
      { status: 500 }
    );
  }
}
