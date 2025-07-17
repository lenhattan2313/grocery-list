"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HouseholdMember } from "@prisma/client";
import { FamilyMemberCard } from "./family-member-card";
import { FamilyMemberDialog } from "./family-member-dialog";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

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
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<HouseholdMember | null>(
    null
  );

  async function handleSubmit(data: {
    email: string;
    role: "admin" | "member";
    dietaryRestrictions?: string;
    allergies?: string;
  }) {
    try {
      const endpoint = selectedMember
        ? `/api/households/${household.id}/members/${selectedMember.id}`
        : `/api/households/${household.id}/members`;

      const response = await fetch(endpoint, {
        method: selectedMember ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      toast.success(
        selectedMember
          ? "Member updated successfully"
          : "Member added successfully"
      );
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save member"
      );
      throw error;
    }
  }

  async function handleRemoveMember(memberId: string) {
    try {
      const response = await fetch(
        `/api/households/${household.id}/members/${memberId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      toast.success("Member removed successfully");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove member"
      );
    }
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
    <Card className="p-6">
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
