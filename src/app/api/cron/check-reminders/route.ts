import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PushService } from "@/lib/push-service";

interface ReminderResult {
  listId: string;
  listName: string;
  userId: string;
  status: "sent" | "failed";
  error?: string;
}

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from a legitimate cron job
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET_TOKEN;

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find all due reminders that haven't been sent yet
    const dueReminders = await prisma.shoppingList.findMany({
      where: {
        hasReminder: true,
        reminderTime: {
          lte: new Date(), // Due now or in the past
        },
        reminderSent: false, // Not sent yet
      },
      include: {
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

    console.log(`Found ${dueReminders.length} due reminders`);

    const results: ReminderResult[] = [];

    for (const reminder of dueReminders) {
      try {
        // Send push notification to the list owner
        await PushService.sendShoppingReminder(
          reminder.userId,
          reminder.name,
          reminder.reminderMessage || undefined,
          reminder.id
        );

        // Mark reminder as sent
        await prisma.shoppingList.update({
          where: { id: reminder.id },
          data: { reminderSent: true },
        });

        results.push({
          listId: reminder.id,
          listName: reminder.name,
          userId: reminder.userId,
          status: "sent",
        });

        console.log(`Sent reminder for list: ${reminder.name}`);
      } catch (error) {
        console.error(
          `Failed to send reminder for list ${reminder.id}:`,
          error
        );
        results.push({
          listId: reminder.id,
          listName: reminder.name,
          userId: reminder.userId,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: dueReminders.length,
      results,
    });
  } catch (error) {
    console.error("Failed to check reminders:", error);
    return NextResponse.json(
      { error: "Failed to check reminders" },
      { status: 500 }
    );
  }
}
