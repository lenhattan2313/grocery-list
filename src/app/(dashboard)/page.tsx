import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { Suspense } from "react";

import { getLists } from "@/app/actions/list";
import { PageSkeleton } from "@/components/common/page-skeleton";
import { getQueryClient } from "@/lib/get-query-client";
import { ShoppingListWithItems } from "@/types/list";
import { PageHeaderWithSearch } from "@/components/common/page-header-with-search";
import { ListsPageClient } from "@/components/dynamic-imports";

export default async function ListsPage() {
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["lists"],
    queryFn: getLists,
  });

  // Get the initial data from the query client
  const initialLists =
    queryClient.getQueryData<ShoppingListWithItems[]>(["lists"]) ?? [];

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PageHeaderWithSearch title="List" className="mb-4" />
      <Suspense fallback={<PageSkeleton />}>
        <ListsPageClient initialLists={initialLists} />
      </Suspense>
    </HydrationBoundary>
  );
}
