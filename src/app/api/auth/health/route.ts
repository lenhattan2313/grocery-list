import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Check environment variables
    const envCheck = {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ? "Set" : "Missing",
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "Set" : "Missing",
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "Set" : "Missing",
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET
        ? "Set"
        : "Missing",
      DATABASE_URL: process.env.DATABASE_URL ? "Set" : "Missing",
      NODE_ENV: process.env.NODE_ENV,
    };

    // Test database connection
    let dbStatus = "Unknown";
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = "Connected";
    } catch (error) {
      dbStatus = "Failed";
      console.error("Database connection failed:", error);
    }

    // Test auth function
    let authStatus = "Unknown";
    try {
      const session = await auth();
      authStatus = session ? "Working" : "No Session";
    } catch (error) {
      authStatus = "Failed";
      console.error("Auth function failed:", error);
    }

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: envCheck,
      database: dbStatus,
      auth: authStatus,
    });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Health check failed",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
