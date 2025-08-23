"use client";

import { Search, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PageHeaderSearchProps {
  onSearch?: (value: string) => void;
  showFavoriteFilter?: boolean;
  isFavoriteFilterActive?: boolean;
  onFavoriteFilterToggle?: () => void;
}

export function PageHeaderSearch({
  onSearch,
  showFavoriteFilter = false,
  isFavoriteFilterActive = false,
  onFavoriteFilterToggle,
}: PageHeaderSearchProps) {
  return (
    <div className="flex items-center gap-2">
      {showFavoriteFilter && (
        <Button
          variant="outline"
          size="sm"
          onClick={onFavoriteFilterToggle}
          className={cn(
            "h-9 px-3 gap-2",
            "border-gray-200 bg-gray-50/50",
            "hover:bg-white hover:border-gray-300",
            "transition-all duration-200",
            "rounded-lg shadow-sm",
            isFavoriteFilterActive &&
              "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
          )}
        >
          <Heart
            className={cn(
              "h-4 w-4",
              isFavoriteFilterActive ? "text-red-500" : "text-gray-400"
            )}
          />
        </Button>
      )}
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
            "rounded-lg shadow-sm",
            "text-gray-800 dark:text-gray-100"
          )}
        />
      </div>
    </div>
  );
}
