import { Navigation } from "@/components/layout/navigation";
import { NotificationBell } from "@/components/layout/notification-bell";
import { auth } from "@/lib/auth";
import { getTimeBasedGreeting } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/signin");
  }

  const greeting = getTimeBasedGreeting();
  const userName = session.user?.name?.split(" ")[0] || "there";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex flex-col justify-center">
              <p className="text-sm font-medium text-gray-500 mb-1">
                {greeting},
              </p>
              <p className="text-xl font-semibold text-gray-900">{userName}</p>
            </div>
            <NotificationBell />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-4 lg:px-6 py-6">
        {children}
      </div>

      {/* Bottom Navigation for Mobile */}
      <Navigation />
    </div>
  );
}
