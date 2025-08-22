"use client";

import { ShoppingCart, Download } from "lucide-react";
import { DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { cn, getProgressColors } from "@/lib/utils";

interface ListDrawerHeaderProps {
  listName: string;
  progress: {
    total: number;
    percentage: number;
  };
  onExport: () => void;
  hasItems?: boolean;
}

export function ListDrawerHeader({
  listName,
  progress,
  onExport,
  hasItems = false,
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
