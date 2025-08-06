import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Test basic database connection
    const result = await prisma.$queryRaw`SELECT 1 as test`;

    // Test if we can access the Account table (used by NextAuth)
    const accountCount = await prisma.account.count();

    // Test if we can access the User table
    const userCount = await prisma.user.count();

    return NextResponse.json({
      status: "success",
      database: "Connected",
      testQuery: result,
      accountCount,
      userCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Database test failed:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Database connection failed",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
