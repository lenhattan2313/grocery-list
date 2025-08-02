import { NextResponse } from "next/server";

export async function GET() {
  const authConfig = {
    nextAuthUrl: process.env.NEXTAUTH_URL,
    nextAuthSecret: process.env.NEXTAUTH_SECRET ? "Set" : "Not Set",
    googleClientId: process.env.GOOGLE_CLIENT_ID ? "Set" : "Not Set",
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ? "Set" : "Not Set",
    nodeEnv: process.env.NODE_ENV,
  };

  return NextResponse.json({
    message: "Auth Configuration Test",
    config: authConfig,
    timestamp: new Date().toISOString(),
  });
}
