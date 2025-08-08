import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PushService } from "@/lib/push-service";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Send test notification to the authenticated user
    await PushService.sendTestNotification(session.user.id);

    return NextResponse.json({
      success: true,
      message: "Test notification sent",
    });
  } catch (error) {
    console.error("Failed to send test notification:", error);
    return NextResponse.json(
      { error: "Failed to send test notification" },
      { status: 500 }
    );
  }
}
