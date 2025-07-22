"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { CreateListSchema } from "@/schema/list-schema";
import { UpdateListItemsSchema } from "@/schema/item-schema";
import { getPusherInstance } from "@/lib/pusher";

export async function getLists() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const lists = await prisma.shoppingList.findMany({
    where: {
      OR: [
        { userId: session.user.id },
        {
          household: {
            members: {
              some: {
                userId: session.user.id,
              },
            },
          },
        },
      ],
    },
    include: {
      items: {
        orderBy: {
          createdAt: "asc",
        },
      },
      user: true,
      household: {
        include: {
          members: {
            include: {
              user: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return lists;
}

export async function createList(name: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const validatedData = CreateListSchema.parse({ name });

  const newList = await prisma.shoppingList.create({
    data: {
      name: validatedData.name,
      userId: session.user.id,
    },
    include: {
      items: true,
      user: true,
      household: {
        include: {
          members: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  return newList;
}

export async function updateNameList(listId: string, name: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const validatedData = CreateListSchema.parse({ name });

  const list = await prisma.shoppingList.findFirst({
    where: {
      id: listId,
      userId: session.user.id,
    },
  });

  if (!list) {
    throw new Error(
      "List not found or you don't have permission to update it."
    );
  }

  const updatedList = await prisma.shoppingList.update({
    where: { id: listId, userId: session.user.id },
    data: {
      name: validatedData.name,
    },
    include: {
      items: true,
      user: true,
      household: {
        include: {
          members: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  if (updatedList.householdId) {
    const pusher = getPusherInstance();
    await pusher.trigger(
      `private-household-${updatedList.householdId}`,
      "list-updated",
      updatedList
    );
  }

  return updatedList;
}

export async function updateList(
  listId: string,
  updates: {
    name?: string;
    isCompleted?: boolean;
    householdId?: string | null;
  }
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const list = await prisma.shoppingList.findFirst({
    where: {
      id: listId,
      OR: [
        { userId: session.user.id },
        {
          household: {
            members: {
              some: {
                userId: session.user.id,
              },
            },
          },
        },
      ],
    },
    select: { userId: true, householdId: true },
  });

  if (!list) {
    throw new Error(
      "List not found or you don't have permission to update it."
    );
  }

  // Only the owner can update the list details like name and completion status.
  if (list.userId !== session.user.id) {
    throw new Error("Only the owner can update this list.");
  }

  const updateData: {
    name?: string;
    isCompleted?: boolean;
    householdId?: string | null;
  } = {};
  if (updates.name) updateData.name = updates.name;
  if (updates.isCompleted !== undefined)
    updateData.isCompleted = updates.isCompleted;

  // Store the old household ID to trigger events on it if needed
  const oldHouseholdId = list.householdId;

  if (updates.householdId !== undefined) {
    if (updates.householdId === null) {
      updateData.householdId = null;
    } else {
      // Verify user is a member of the household they are assigning the list to
      const householdMember = await prisma.householdMember.findFirst({
        where: {
          householdId: updates.householdId,
          userId: session.user.id,
        },
      });
      if (!householdMember) {
        throw new Error("You are not a member of this household.");
      }
      updateData.householdId = updates.householdId;
    }
  }

  const updatedList = await prisma.shoppingList.update({
    where: { id: listId, userId: session.user.id },
    data: updateData,
    include: {
      items: true,
      user: true,
      household: {
        include: {
          members: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  // Trigger on the old household channel if the list was unshared
  if (oldHouseholdId && !updatedList.householdId) {
    const pusher = getPusherInstance();
    await pusher.trigger(
      `private-household-${oldHouseholdId}`,
      "list-deleted",
      { id: listId }
    );
  }

  // Trigger on the household channel if the list is shared
  if (updatedList.householdId) {
    const pusher = getPusherInstance();
    await pusher.trigger(
      `private-household-${updatedList.householdId}`,
      "list-updated",
      updatedList
    );
  }

  return updatedList;
}

export async function deleteList(id: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  // We need to get the householdId before deleting the list
  const list = await prisma.shoppingList.findUnique({
    where: { id },
    select: { householdId: true },
  });

  await prisma.shoppingList.delete({
    where: {
      id,
      userId: session.user.id,
    },
  });

  // Trigger on the household channel if the list was part of one
  if (list?.householdId) {
    const pusher = getPusherInstance();
    await pusher.trigger(
      `private-household-${list.householdId}`,
      "list-deleted",
      { id }
    );
  }
}

export async function getList(id: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const list = await prisma.shoppingList.findFirst({
    where: {
      id,
      OR: [
        { userId: session.user.id },
        {
          household: {
            members: {
              some: {
                userId: session.user.id,
              },
            },
          },
        },
      ],
    },
    include: {
      items: {
        orderBy: {
          createdAt: "asc",
        },
      },
      user: true,
      household: {
        include: {
          members: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  return list;
}

export async function updateListItems(
  listId: string,
  items: z.infer<typeof UpdateListItemsSchema>
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const list = await prisma.shoppingList.findFirst({
    where: {
      id: listId,
      userId: session.user.id,
    },
  });

  if (!list) {
    throw new Error("List not found or permission denied.");
  }

  const validatedItems = UpdateListItemsSchema.parse(items);

  await prisma.$transaction(async (tx) => {
    await tx.shoppingItem.deleteMany({
      where: { listId: listId },
    });

    if (validatedItems.length > 0) {
      await tx.shoppingItem.createMany({
        data: validatedItems.map((item) => ({
          ...item,
          listId: listId,
        })),
      });
    }
  });

  const updatedList = await prisma.shoppingList.findUnique({
    where: { id: listId },
    include: {
      items: {
        orderBy: {
          createdAt: "asc",
        },
      },
      user: true,
      household: {
        include: {
          members: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  if (updatedList?.householdId) {
    const pusher = getPusherInstance();
    await pusher.trigger(
      `private-household-${updatedList.householdId}`,
      "list-updated", // Firing 'list-updated' as the client is listening for this
      updatedList
    );
  }

  return updatedList;
}
