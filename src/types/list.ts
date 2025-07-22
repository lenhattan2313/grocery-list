import { Prisma } from "@prisma/client";

export type ShoppingListWithItems = Prisma.ShoppingListGetPayload<{
  include: {
    items: true;
    household: {
      include: {
        members: {
          include: {
            user: true;
          };
        };
      };
    };
    user: true;
  };
}>;
