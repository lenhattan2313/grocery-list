import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, children, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between w-full px-4 sm:px-6 lg:px-8",
        className
      )}
    >
      <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
        {title}
      </h2>

      {children}
    </div>
  );
}
