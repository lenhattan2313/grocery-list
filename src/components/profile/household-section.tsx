"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HouseholdMember } from "@prisma/client";
import { FamilyMemberCard } from "./family-member-card";
import { FamilyMemberDialog } from "./family-member-dialog";
import { Plus } from "lucide-react";
import {
  useRemoveMemberMutation,
  useSaveMemberMutation,
} from "@/hooks/use-household-mutations";
import { Role } from "@/constants/role";

interface HouseholdSectionProps {
  currentUserId: string;
  household: {
    id: string;
    name: string;
    members: Array<
      HouseholdMember & {
        user: {
          id: string;
          name: string | null;
          email: string;
          image: string | null;
        };
      }
    >;
  };
}

export function HouseholdSection({
  currentUserId,
  household,
}: HouseholdSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<HouseholdMember | null>(
    null
  );

  const saveMemberMutation = useSaveMemberMutation({
    householdId: household.id,
  });
  const removeMemberMutation = useRemoveMemberMutation({
    householdId: household.id,
  });

  async function handleSubmit(data: {
    email: string;
    role: Role;
    dietaryRestrictions?: string;
    allergies?: string;
  }) {
    try {
      await saveMemberMutation.mutateAsync({
        memberData: data,
        memberId: selectedMember?.id,
      });
      setDialogOpen(false);
    } catch {
      // error is already handled by the mutation hook's onError
    }
  }

  function handleRemoveMember(memberId: string) {
    removeMemberMutation.mutate({ memberId });
  }

  function handleEdit(member: HouseholdMember) {
    setSelectedMember(member);
    setDialogOpen(true);
  }

  function handleAdd() {
    setSelectedMember(null);
    setDialogOpen(true);
  }

  return (
    <Card className="p-6 gap-0">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {household.name}
          </h3>
          <p className="text-sm text-gray-600">
            {household.members.length} member
            {household.members.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={handleAdd} size="sm" aria-label="Add Member">
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>

      <div className="space-y-4">
        {household.members.map((member) => (
          <FamilyMemberCard
            key={member.id}
            member={member}
            isCurrentUser={member.user.id === currentUserId}
            onEdit={() => handleEdit(member)}
            onRemove={() => handleRemoveMember(member.id)}
          />
        ))}
      </div>

      <FamilyMemberDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        member={
          selectedMember as
            | (HouseholdMember & { user: { email: string } })
            | undefined
        }
      />
    </Card>
  );
}
