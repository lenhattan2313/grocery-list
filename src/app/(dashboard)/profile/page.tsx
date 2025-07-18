import { getHousehold, createHousehold } from "@/app/actions/household";
import { auth } from "@/lib/auth";
import { HouseholdSection } from "@/components/profile/household-section";
import { Card } from "@/components/ui/card";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.email) {
    redirect("/signin");
  }

  let household = await getHousehold(session.user.id);
  if (!household) {
    household = await createHousehold(session.user.id);
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Profile</h2>
        <p className="text-gray-600 mt-2">
          Manage your profile and family members
        </p>
      </div>

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
        {household && (
          <HouseholdSection
            currentUserId={session.user.id}
            household={household}
          />
        )}
      </div>
    </div>
  );
}
