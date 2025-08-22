"use client";

import { Button } from "@/components/ui/button";
import { DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { cn, getProgressColors } from "@/lib/utils";
import { Copy, Download, ShoppingCart } from "lucide-react";

interface ListDrawerHeaderProps {
  listName: string;
  progress: {
    total: number;
    percentage: number;
  };
  onExport: () => void;
  onCopy: () => void;
  hasItems?: boolean;
  isCopying?: boolean;
}

export function ListDrawerHeader({
  listName,
  progress,
  onExport,
  onCopy,
  hasItems = false,
  isCopying = false,
}: ListDrawerHeaderProps) {
  return (
    <DrawerHeader>
      <DrawerTitle className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          {listName}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isCopying ? "default" : "outline"}
            size="icon"
            onClick={onCopy}
            disabled={!hasItems}
            className={cn(
              "h-8 w-8 transition-all duration-200",
              isCopying && "bg-primary"
            )}
            aria-label="Copy list items to clipboard"
          >
            {isCopying ? (
              <Copy
                className={cn(
                  "h-4 w-4",
                  isCopying && "text-white dark:text-black"
                )}
              />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onExport}
            disabled={!hasItems}
            className="h-8 w-8"
            aria-label="Export list to text file"
          >
            <Download className="h-4 w-4" />
          </Button>
          {progress.total > 0 && (
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-1  dark:border-gray-600 bg-transparent",
                getProgressColors(progress.percentage).progressColor
              )}
            >
              {progress.percentage}%
            </div>
          )}
        </div>
      </DrawerTitle>
    </DrawerHeader>
  );
}
