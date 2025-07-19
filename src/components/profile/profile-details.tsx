"use client";

import { useSession } from "next-auth/react";
import { HouseholdSection } from "@/components/profile/household-section";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useHouseholdQuery } from "@/hooks/use-household-query";

function ProfileSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card className="p-6">
        <Skeleton className="h-6 w-1/3 mb-4" />
        <div className="space-y-4">
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
      <Card className="p-6">
        <Skeleton className="h-6 w-1/3 mb-4" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* User Profile Section */}
      <Card className="p-6 gap-0">
        <h3 className="text-lg font-semibold text-gray-900">Your Profile</h3>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Name</label>
            <p className="text-gray-900">
              {session.user.name || "No name set"}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <p className="text-gray-900">{session.user.email}</p>
          </div>
        </div>
      </Card>

      {/* Household Section */}
      <HouseholdSection
        currentUserId={session.user.id!}
        household={household}
      />
    </div>
  );
}
