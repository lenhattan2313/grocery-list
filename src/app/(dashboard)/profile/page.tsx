import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileDetails } from "@/components/dynamic-imports";

// export const experimental_ppr = true;
export default function ProfilePage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Profile</h2>
        <p className="text-gray-600 mt-2">
          Manage your profile and family members
        </p>
      </div>
      <Suspense
        fallback={
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        }
      >
        <ProfileDetails />
      </Suspense>
    </div>
  );
}
