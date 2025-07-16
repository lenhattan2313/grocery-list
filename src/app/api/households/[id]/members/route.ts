import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const memberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member"]),
  dietaryRestrictions: z.string().optional(),
  allergies: z.string().optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const { id } = await context.params;
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
    const validatedData = memberSchema.parse(body);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Check if user is already a member
    const existingMember = await prisma.householdMember.findFirst({
      where: {
        householdId: id,
        userId: user.id,
      },
    });

    if (existingMember) {
      return new NextResponse("User is already a member", { status: 400 });
    }

    // Add member to household
    const member = await prisma.householdMember.create({
      data: {
        userId: user.id,
        householdId: id,
        role: validatedData.role,
        dietaryRestrictions: validatedData.dietaryRestrictions,
        allergies: validatedData.allergies,
      },
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

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const { id } = await context.params;
    // Verify user is member of household
    const members = await prisma.householdMember.findMany({
      where: {
        householdId: id,
        household: {
          members: {
            some: {
              userId: session.user.id,
            },
          },
        },
      },
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

    return NextResponse.json(members);
  } catch {
    return new NextResponse("Internal error", { status: 500 });
  }
}
