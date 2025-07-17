import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { Suspense } from "react";

import { getLists } from "@/app/actions/list";
import { ListsPageClient } from "@/app/(dashboard)/list/list-page-client";
import { ListPageSkeleton } from "@/components/lists/list-page-skeleton";
import { getQueryClient } from "@/lib/get-query-client";
import { ShoppingListWithItems } from "@/hooks/use-lists-query";

export default async function ListsPage() {
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery<ShoppingListWithItems[]>({
    queryKey: ["lists"],
    queryFn: getLists,
  });

  const initialLists =
    queryClient.getQueryData<ShoppingListWithItems[]>(["lists"]) ?? [];

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<ListPageSkeleton />}>
        <ListsPageClient initialLists={initialLists} />
      </Suspense>
    </HydrationBoundary>
  );
}
