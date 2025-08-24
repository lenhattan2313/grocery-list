"use client";

import { useSearchParamState } from "@/hooks/use-search-params";
import { PageHeader } from "@/components/common/page-header";
import { PageHeaderSearch } from "@/components/common/page-header-search";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderWithSearchProps {
  title: string;
  className?: string;
  searchParam?: string;
  showFavoriteFilter?: boolean;
  isFavoriteFilterActive?: boolean;
  onFavoriteFilterToggle?: () => void;
}

export function PageHeaderWithSearch({
  title,
  className,
  searchParam = "q",
  showFavoriteFilter = false,
  isFavoriteFilterActive = false,
  onFavoriteFilterToggle,
}: PageHeaderWithSearchProps) {
  const [, setSearchQuery] = useSearchParamState(searchParam, "");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  return (
    <PageHeader
      title={title}
      className={cn(
        className,
        "transition-all duration-500 ease-in-out",
        isSearchExpanded && "justify-end"
      )}
    >
      <PageHeaderSearch
        onSearch={setSearchQuery}
        onExpandChange={setIsSearchExpanded}
        showFavoriteFilter={showFavoriteFilter}
        isFavoriteFilterActive={isFavoriteFilterActive}
        onFavoriteFilterToggle={onFavoriteFilterToggle}
      />
    </PageHeader>
  );
}
