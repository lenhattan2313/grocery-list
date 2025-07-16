import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function getHousehold() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const household = await prisma.household.findFirst({
    where: {
      members: {
        some: {
          userId: session.user.id,
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

export async function createHousehold() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const household = await prisma.household.create({
    data: {
      name: "My Household",
      members: {
        create: {
          userId: session.user.id,
          role: "admin" as const,
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
