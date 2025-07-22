"use client";
import { Button } from "@/components/ui/button";
import { useHouseholdQuery } from "@/hooks/use-household-query";
import { Loader } from "lucide-react";
import { useUpdateListMutation, useListQuery } from "@/hooks/use-lists-query";
import { useDialogStore } from "@/stores/dialog-store";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useSession } from "next-auth/react";

interface ShareListDialogProps {
  listId: string;
}

export function ShareListDialog({ listId }: ShareListDialogProps) {
  const { data: session } = useSession();
  const { household, isLoading: isLoadingHousehold } = useHouseholdQuery();
  const { data: list, isLoading: isLoadingList } = useListQuery(listId);
  const updateListMutation = useUpdateListMutation();
  const hideDialog = useDialogStore((state) => state.hideDialog);

  const otherMembers = household?.members.filter(
    (member) => member.userId !== session?.user?.id
  );

  const isShared = !!list?.householdId;

  const handleToggleShare = () => {
    updateListMutation.mutate(
      {
        id: listId,
        updates: { householdId: isShared ? null : household?.id ?? null },
      },
      {
        onSuccess: () => {
          hideDialog();
        },
      }
    );
  };

  const isLoading = isLoadingHousehold || isLoadingList;

  return (
    <div>
      <div className="text-sm text-muted-foreground">
        {isShared
          ? "This list is currently shared with your household."
          : "Share this list with your household members."}
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader className="animate-spin" />
        </div>
      ) : (
        <div className="py-4 space-y-4">
          {household && otherMembers && otherMembers.length > 0 ? (
            <div className="flex flex-col space-y-2">
              <p className="font-bold">Household Members:</p>
              <div className="flex items-center pt-2 -space-x-2">
                {otherMembers.map((member) => (
                  <Avatar key={member.id} className="h-8 w-8">
                    <AvatarImage
                      src={member.user.image ?? undefined}
                      alt={member.user.name ?? ""}
                    />
                    <AvatarFallback>{member.user.name?.[0]}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-4">
              <p>
                You don&apos;t have any other members in your household to share
                with.
              </p>
            </div>
          )}
        </div>
      )}
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={() => hideDialog()}>
          Cancel
        </Button>
        <Button
          onClick={handleToggleShare}
          disabled={
            !household ||
            !otherMembers ||
            otherMembers.length === 0 ||
            updateListMutation.isPending
          }
        >
          {updateListMutation.isPending
            ? "Saving..."
            : isShared
            ? "Unshare"
            : "Share with Household"}
        </Button>
      </div>
    </div>
  );
}
