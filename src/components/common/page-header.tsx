"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  onSearch?: (value: string) => void;
  className?: string;
}

export function PageHeader({ title, onSearch, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between w-full", className)}>
      <h2 className="text-3xl font-bold text-gray-900">{title}</h2>

      <div className="relative w-[200px] min-w-[180px] group">
        <Search
          className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4",
            "text-gray-400 transition-colors duration-200",
            "group-hover:text-gray-500 group-focus-within:text-gray-600"
          )}
        />
        <Input
          type="text"
          placeholder="Search..."
          onChange={(e) => onSearch?.(e.target.value)}
          className={cn(
            "pl-9 pr-4 h-9",
            "bg-gray-50/50 border-gray-200",
            "placeholder:text-gray-400 placeholder:text-sm",
            "hover:bg-white hover:border-gray-300",
            "focus:ring-2 focus:ring-gray-200 focus:border-gray-300",
            "transition-all duration-200",
            "rounded-lg shadow-sm"
          )}
        />
      </div>
    </div>
  );
}
