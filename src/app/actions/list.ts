"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const CreateListSchema = z.object({
  name: z
    .string()
    .min(1, "List name is required")
    .max(100, "List name too long"),
});

const UpdateListSchema = z.object({
  name: z
    .string()
    .min(1, "List name is required")
    .max(100, "List name too long")
    .optional(),
  isCompleted: z.boolean().optional(),
});

export async function getLists() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const lists = await prisma.shoppingList.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      items: {
        orderBy: {
          createdAt: "asc",
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
    },
  });

  return newList;
}

export async function updateList(
  id: string,
  updates: z.infer<typeof UpdateListSchema>
) {
  const session = await auth();
  if (!session?.user?.id) return null;
  const validatedData = UpdateListSchema.parse(updates);

  // If the completion status is not being updated, just update the list name.
  if (validatedData.isCompleted === undefined) {
    const updatedList = await prisma.shoppingList.update({
      where: {
        id,
        userId: session.user.id,
      },
      data: validatedData,
      include: {
        items: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });
    return updatedList;
  }

  // If the completion status is being updated, update the list and all its items in a transaction.
  const [updatedList] = await prisma.$transaction([
    prisma.shoppingList.update({
      where: { id, userId: session.user.id },
      data: validatedData,
      include: {
        items: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    }),
    prisma.shoppingItem.updateMany({
      where: { listId: id },
      data: { isCompleted: validatedData.isCompleted },
    }),
  ]);

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

  const list = await prisma.shoppingList.findUnique({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      items: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  return list;
}

const CreateItemSchema = z.object({
  name: z.string().min(1).max(100),
  quantity: z.number().min(1),
  unit: z.string(),
});

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

const UpdateItemSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  quantity: z.number().min(1).optional(),
  unit: z.string().optional(),
  isCompleted: z.boolean().optional(),
  notes: z.string().nullable().optional(),
});

export async function updateItem(
  itemId: string,
  updates: z.infer<typeof UpdateItemSchema>
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const validatedData = UpdateItemSchema.parse(updates);

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

const UpdateListItemsSchema = z.array(
  z.object({
    name: z.string().min(1).max(100),
    quantity: z.number().min(1),
    unit: z.string(),
    isCompleted: z.boolean(),
  })
);

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
    },
  });

  return updatedList;
}
