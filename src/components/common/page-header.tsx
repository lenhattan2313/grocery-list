import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, children, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between w-full", className)}>
      <h2 className="text-3xl font-bold text-gray-900">{title}</h2>

      {children}
    </div>
  );
}
