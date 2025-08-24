"use client";

import { Search, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";

interface PageHeaderSearchProps {
  onSearch?: (value: string) => void;
  showFavoriteFilter?: boolean;
  isFavoriteFilterActive?: boolean;
  onFavoriteFilterToggle?: () => void;
  onExpandChange?: (isExpanded: boolean) => void;
}

export function PageHeaderSearch({
  onSearch,
  showFavoriteFilter = false,
  isFavoriteFilterActive = false,
  onFavoriteFilterToggle,
  onExpandChange,
}: PageHeaderSearchProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Notify parent component about expansion state
  useEffect(() => {
    onExpandChange?.(isExpanded);
  }, [isExpanded, onExpandChange]);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        isExpanded
      ) {
        handleCollapse();
      }
    }

    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExpanded]);

  const handleExpand = () => {
    setIsExpanded(true);
  };

  const handleCollapse = () => {
    setIsExpanded(false);
    setSearchValue("");
    onSearch?.("");
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    onSearch?.(value);
  };
  if (isExpanded) {
    return (
      <div className="relative w-full group" ref={containerRef}>
        <Search
          className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4",
            "text-gray-400 transition-colors duration-200",
            "group-hover:text-gray-500 group-focus-within:text-gray-600"
          )}
        />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search..."
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className={cn(
            "pl-9 pr-4 h-9",
            "bg-white border-gray-300",
            "placeholder:text-gray-400 placeholder:text-sm",
            "hover:bg-white hover:border-gray-400",
            "focus:ring-2 focus:ring-gray-200 focus:border-gray-400",
            "transition-all duration-500",
            "rounded-lg shadow-sm",
            "text-gray-800 dark:text-gray-100"
          )}
        />
      </div>
    );
  }
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
            "transition-all duration-500",
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

      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExpand}
          className={cn(
            "h-9 w-9 p-0",
            "border-gray-200 bg-gray-50/50",
            "hover:bg-white hover:border-gray-300",
            "transition-all duration-500",
            "rounded-lg shadow-sm"
          )}
        >
          <Search className="h-4 w-4 text-gray-400" />
        </Button>
      </div>
    </div>
  );
}
