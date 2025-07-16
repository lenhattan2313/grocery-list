import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateSchema = z.object({
  role: z.enum(["admin", "member"]).optional(),
  dietaryRestrictions: z.string().optional(),
  allergies: z.string().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const { id, memberId } = await context.params;
    // Verify user is admin of household
    const household = await prisma.household.findFirst({
      where: {
        id,
        members: {
          some: {
            userId: session.user.id,
            role: "admin",
          },
        },
      },
    });

    if (!household) {
      return new NextResponse("Not found or not authorized", { status: 404 });
    }

    const body = await request.json();
    const validatedData = updateSchema.parse(body);

    // Update member
    const member = await prisma.householdMember.update({
      where: {
        id: memberId,
        householdId: id,
      },
      data: validatedData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(member);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 400 });
    }
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const { id, memberId } = await context.params;
    // Verify user is admin of household
    const household = await prisma.household.findFirst({
      where: {
        id,
        members: {
          some: {
            userId: session.user.id,
            role: "admin",
          },
        },
      },
    });

    if (!household) {
      return new NextResponse("Not found or not authorized", { status: 404 });
    }

    // Check if trying to remove the last admin
    const member = await prisma.householdMember.findUnique({
      where: { id: memberId },
    });

    if (member?.role === "admin") {
      const adminCount = await prisma.householdMember.count({
        where: {
          householdId: id,
          role: "admin",
        },
      });

      if (adminCount <= 1) {
        return new NextResponse(
          "Cannot remove the last admin of the household",
          { status: 400 }
        );
      }
    }

    // Delete member
    await prisma.householdMember.delete({
      where: {
        id: memberId,
        householdId: id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse("Internal error", { status: 500 });
  }
}
