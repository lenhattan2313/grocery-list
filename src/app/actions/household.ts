import { prisma } from "@/lib/db";
import { Role } from "@/constants/role";

export async function getHousehold(userId: string) {
  const household = await prisma.household.findFirst({
    where: {
      members: {
        some: {
          userId: userId,
        },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
    },
  });

  return household;
}

export async function createHousehold(userId: string) {
  const household = await prisma.household.create({
    data: {
      name: "My Household",
      members: {
        create: {
          userId: userId,
          role: Role.ADMIN,
        },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
    },
  });

  return household;
}

export async function saveMember(
  householdId: string,
  memberData: {
    email: string;
    role: string;
    dietaryRestrictions?: string;
    allergies?: string;
  },
  memberId?: string
) {
  const user = await prisma.user.findUnique({
    where: { email: memberData.email },
  });

  if (!user) {
    throw new Error("User with that email not found.");
  }

  const data = {
    ...memberData,
    userId: user.id,
    householdId,
  };

  const member = memberId
    ? await prisma.householdMember.update({
        where: { id: memberId },
        data,
      })
    : await prisma.householdMember.create({
        data,
      });

  return member;
}

export async function removeMember(memberId: string) {
  await prisma.householdMember.delete({
    where: { id: memberId },
  });
}
