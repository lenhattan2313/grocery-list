import { NextResponse } from "next/server";
import { config } from "@/config";

export async function GET() {
  try {
    if (!config.push.vapidPublicKey) {
      return NextResponse.json(
        { error: "VAPID public key not configured" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      publicKey: config.push.vapidPublicKey,
    });
  } catch (error) {
    console.error("Failed to get VAPID public key:", error);
    return NextResponse.json(
      { error: "Failed to get VAPID public key" },
      { status: 500 }
    );
  }
}
