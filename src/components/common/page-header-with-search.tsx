"use client";

import { useSearchParamState } from "@/hooks/use-search-params";
import { PageHeader } from "@/components/common/page-header";
import { PageHeaderSearch } from "@/components/common/page-header-search";

interface PageHeaderWithSearchProps {
  title: string;
  className?: string;
  searchParam?: string;
}

export function PageHeaderWithSearch({
  title,
  className,
  searchParam = "q",
}: PageHeaderWithSearchProps) {
  const [, setSearchQuery] = useSearchParamState(searchParam, "");

  return (
    <PageHeader title={title} className={className}>
      <PageHeaderSearch onSearch={setSearchQuery} />
    </PageHeader>
  );
}
