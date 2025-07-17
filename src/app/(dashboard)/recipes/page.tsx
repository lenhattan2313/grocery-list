import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { Suspense } from "react";

import RecipesPageClient from "@/app/(dashboard)/recipes/recipes-page-client";
import { PageSkeleton } from "@/components/common/page-skeleton";
import {
  RECIPES_QUERY_KEY,
  RecipeWithIngredients,
} from "@/hooks/use-recipes-query";
import { getQueryClient } from "@/lib/get-query-client";
import { getRecipes } from "@/app/actions/recipes";
export default async function RecipesPage() {
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery<RecipeWithIngredients[]>({
    queryKey: [RECIPES_QUERY_KEY],
    queryFn: getRecipes,
  });

  const initialRecipes =
    queryClient.getQueryData<RecipeWithIngredients[]>([RECIPES_QUERY_KEY]) ??
    [];

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<PageSkeleton />}>
        <RecipesPageClient initialRecipes={initialRecipes} />
      </Suspense>
    </HydrationBoundary>
  );
}
