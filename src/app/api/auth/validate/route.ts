import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { valid: false, error: "No session found" },
        { status: 401 }
      );
    }

    // Check if user exists in database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        {
          valid: false,
          error: "User not found in database",
          requiresReauth: true,
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      valid: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Session validation failed:", error);
    return NextResponse.json(
      {
        valid: false,
        error: "Session validation failed",
        requiresReauth: true,
      },
      { status: 500 }
    );
  }
}
