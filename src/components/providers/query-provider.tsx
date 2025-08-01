"use client";

import {
  QueryClientProvider,
  HydrationBoundary,
  dehydrate,
} from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";

// Only import ReactQueryDevtools in development
let ReactQueryDevtools: React.ComponentType<{
  initialIsOpen?: boolean;
}> | null = null;

if (process.env.NODE_ENV === "development") {
  // Dynamic import only in development with explicit chunk name
  import(
    /* webpackChunkName: "query-devtools" */ "@tanstack/react-query-devtools"
  ).then((mod) => {
    ReactQueryDevtools = mod.ReactQueryDevtools;
  });
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={dehydrate(queryClient)}>
        {children}
      </HydrationBoundary>
      {process.env.NODE_ENV === "development" && ReactQueryDevtools && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
