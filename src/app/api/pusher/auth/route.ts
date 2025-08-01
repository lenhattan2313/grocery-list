import { auth } from "@/lib/auth";
import { getPusherInstance } from "@/lib/pusher";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const data = await req.formData();
    const socketId = data.get("socket_id") as string;
    const channel = data.get("channel_name") as string;

    // We are authorizing all private channels for now.
    // You could add more specific logic here if needed
    // e.g. check if the user is a member of the list based on the channel name.
    const pusher = getPusherInstance();
    const authResponse = pusher.authorizeChannel(socketId, channel);

    return new Response(JSON.stringify(authResponse));
  } catch {
    return new Response("Internal Server Error", { status: 500 });
  }
}
