"use client";

import { signOut, useSession } from "next-auth/react";
import { HouseholdSection } from "@/components/profile/household-section";
import { PreferencesSection } from "@/components/profile/preferences-section";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useHouseholdQuery } from "@/hooks/use-household-query";

function ProfileSkeleton() {
  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <Skeleton className="h-6 w-1/3 mb-4" />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-1/4" />
              <Skeleton className="h-5 w-1/2" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-1/4" />
              <Skeleton className="h-5 w-1/2" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <Skeleton className="h-6 w-1/3 mb-4" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </Card>
      </div>
      <Card className="p-4">
        <Skeleton className="h-6 w-1/3 mb-4" />
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-6 w-12" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-6 w-12" />
          </div>
        </div>
      </Card>
    </div>
  );
}

export function ProfileDetails() {
  const { data: session, status } = useSession();
  const { household, isLoading } = useHouseholdQuery();

  if (isLoading || status === "loading") {
    return <ProfileSkeleton />;
  }

  if (!session?.user || !household) {
    return null;
  }

  return (
    <div className="space-y-6 mb-16 overflow-y-auto h-[calc(100vh-14rem)] px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* User Profile Section */}
        <Card className="p-4 gap-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Account Information
          </h3>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Name
              </label>
              <p className="text-gray-900 dark:text-gray-100">
                {session.user.name || "No name set"}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <p className="text-gray-900 dark:text-gray-100">
                {session.user.email}
              </p>
            </div>
          </div>
        </Card>

        {/* Preferences Section */}
        <PreferencesSection />
        {/* Household Section */}
        <HouseholdSection
          currentUserId={session.user.id!}
          household={household}
        />
      </div>

      {/* Logout Section */}

      <Button
        variant="outline"
        className="text-destructive border-destructive w-full mb-20 dark:text-destructive dark:border-destructive"
        onClick={() => signOut({ callbackUrl: "/signin" })}
      >
        Log Out
      </Button>
    </div>
  );
}
