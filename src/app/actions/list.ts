"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { CreateListSchema } from "@/schema/list-schema";
import {
  CreateItemSchema,
  UpdateCreateItemSchema,
  UpdateListItemsSchema,
} from "@/schema/item-schema";

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

  revalidatePath("/list");
  return newList;
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
    select: { userId: true },
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
  revalidatePath("/list");
  return updatedList;
}

export async function deleteList(id: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  await prisma.shoppingList.delete({
    where: {
      id,
      userId: session.user.id,
    },
  });
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

export async function addItem(
  listId: string,
  itemData: z.infer<typeof CreateItemSchema>
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const validatedData = CreateItemSchema.parse(itemData);

  const list = await prisma.shoppingList.findFirst({
    where: {
      id: listId,
      userId: session.user.id,
    },
  });

  if (!list) {
    throw new Error("List not found or permission denied.");
  }

  const newItem = await prisma.shoppingItem.create({
    data: {
      ...validatedData,
      listId: listId,
    },
  });

  return newItem;
}

export async function updateItem(
  itemId: string,
  updates: z.infer<typeof UpdateCreateItemSchema>
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const validatedData = UpdateCreateItemSchema.parse(updates);

  const item = await prisma.shoppingItem.findUnique({
    where: { id: itemId },
    select: { list: { select: { userId: true } } },
  });

  if (item?.list.userId !== session.user.id) {
    throw new Error("Permission denied.");
  }

  const updatedItem = await prisma.shoppingItem.update({
    where: { id: itemId },
    data: validatedData,
  });

  return updatedItem;
}

export async function deleteItem(itemId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const item = await prisma.shoppingItem.findUnique({
    where: { id: itemId },
    select: { list: { select: { userId: true } } },
  });

  if (item?.list.userId !== session.user.id) {
    throw new Error("Permission denied.");
  }

  await prisma.shoppingItem.delete({
    where: { id: itemId },
  });
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

  return updatedList;
}
