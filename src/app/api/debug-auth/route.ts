import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    nextAuthUrl: process.env.NEXTAUTH_URL,
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    message: process.env.NEXTAUTH_URL 
      ? "NEXTAUTH_URL is set correctly" 
      : "NEXTAUTH_URL is missing - this is the problem!"
  });
} 