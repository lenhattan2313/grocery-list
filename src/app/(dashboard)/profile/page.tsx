import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileDetails } from "@/components/dynamic-imports";

// export const experimental_ppr = true;
export default function ProfilePage() {
  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 px-4 sm:px-6 lg:px-8">
        Profile
      </h2>
      <Suspense
        fallback={
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 sm:px-6 lg:px-8">
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
