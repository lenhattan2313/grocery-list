import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HouseholdMember } from "@prisma/client";
import { MoreVertical, UserCircle2 } from "lucide-react";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FamilyMemberCardProps {
  member: HouseholdMember & {
    user: {
      name: string | null;
      email: string;
      image: string | null;
    };
  };
  isCurrentUser?: boolean;
  onEdit?: () => void;
  onRemove?: () => void;
}

export function FamilyMemberCard({
  member,
  isCurrentUser,
  onEdit,
  onRemove,
}: FamilyMemberCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {member.user.image ? (
            <div className="relative w-10 h-10">
              <Image
                src={member.user.image}
                alt={member.user.name || "Member profile"}
                fill
                sizes="40px"
                className="rounded-full object-cover"
                priority={false}
              />
            </div>
          ) : (
            <UserCircle2 className="w-10 h-10 text-gray-400" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-900">
                {member.user.name || member.user.email}
              </h3>
              {isCurrentUser && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  You
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 capitalize">{member.role}</p>
          </div>
        </div>

        {!isCurrentUser && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>Edit Member</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600" onClick={onRemove}>
                Remove Member
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {(member.dietaryRestrictions || member.allergies) && (
        <div className="mt-3 space-y-1">
          {member.dietaryRestrictions && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">Dietary:</span>{" "}
              {member.dietaryRestrictions}
            </p>
          )}
          {member.allergies && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">Allergies:</span> {member.allergies}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
