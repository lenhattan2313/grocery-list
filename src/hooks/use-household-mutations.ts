import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { HouseholdMember } from "@prisma/client";
import { Role } from "@/constants/role";
import { removeMember, saveMember } from "@/app/actions/household";

interface SaveMemberPayload {
  email: string;
  role: Role;
  dietaryRestrictions?: string;
  allergies?: string;
}

interface SaveMemberVariables {
  memberData: SaveMemberPayload;
  memberId?: string;
}

export function useSaveMemberMutation({
  householdId,
}: {
  householdId: string;
}) {
  return useMutation<HouseholdMember, Error, SaveMemberVariables>({
    mutationFn: async ({ memberData, memberId }) => {
      return saveMember(householdId, memberData, memberId);
    },
    onSuccess: (_, { memberId }) => {
      toast.success(
        memberId ? "Member updated successfully" : "Member added successfully"
      );
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

interface RemoveMemberVariables {
  memberId: string;
}

export function useRemoveMemberMutation() {
  return useMutation<void, Error, RemoveMemberVariables>({
    mutationFn: async ({ memberId }) => {
      return removeMember(memberId);
    },
    onSuccess: () => {
      toast.success("Member removed successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
