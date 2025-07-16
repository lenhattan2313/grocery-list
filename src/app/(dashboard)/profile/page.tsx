import { auth } from "@/lib/auth";
import { HouseholdSection } from "@/components/profile/household-section";
import { Card } from "@/components/ui/card";
import { redirect } from "next/navigation";
import { getHousehold, createHousehold } from "@/app/actions/household";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.email) {
    redirect("/signin");
  }

  // Get user's household with members
  let household = await getHousehold();

  // If no household exists, create one for the user
  if (!household) {
    household = await createHousehold();
    if (household) {
      return redirect("/profile");
    }
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
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Your Profile
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <p className="text-gray-900">
                {session.user.name || "No name set"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
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
