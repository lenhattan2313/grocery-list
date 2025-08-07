import { Navigation } from "@/components/layout/navigation";
import { NotificationBell } from "@/components/layout/notification-bell";
import { Preloader } from "@/components/common/preloader";
import { getTimeBasedGreeting } from "@/lib/utils";
import { Suspense } from "react";

// Separate component for session-dependent content
async function UserHeader() {
  const greeting = getTimeBasedGreeting();
  const userName = "there";

  return (
    <div className="flex flex-col justify-center">
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
        {greeting},
      </p>
      <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        {userName}
      </p>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background overflow-x-hidden">
      {/* Header */}
      <header className="bg-white dark:bg-background shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Suspense
              fallback={
                <div className="flex flex-col justify-center">
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-600 rounded animate-pulse mb-1"></div>
                  <div className="h-6 w-24 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                </div>
              }
            >
              <UserHeader />
            </Suspense>
            <NotificationBell />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6">{children}</div>

      {/* Bottom Navigation for Mobile */}
      <Navigation />

      {/* Preloader for heavy dependencies */}
      <Preloader />
    </div>
  );
}

// Optimize for back/forward cache
// export const dynamic = "force-dynamic";
// export const revalidate = 0;
