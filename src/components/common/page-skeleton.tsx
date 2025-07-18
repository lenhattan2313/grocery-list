import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/common/page-header";

function SkeletonCard() {
  return (
    <Card className="p-4 space-y-3">
      <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
      <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
      <div className="flex justify-between items-center pt-2">
        <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse" />
        <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
      </div>
    </Card>
  );
}

export function PageSkeleton({
  numCards = 3,
  title = "List",
}: {
  numCards?: number;
  title?: string;
}) {
  return (
    <div>
      <PageHeader title={title} className="mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: numCards }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    </div>
  );
}
