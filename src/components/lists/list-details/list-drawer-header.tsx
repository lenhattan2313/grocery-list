"use client";

import { ShoppingCart } from "lucide-react";
import { DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { cn, getProgressColors } from "@/lib/utils";

interface ListDrawerHeaderProps {
  listName: string;
  progress: {
    total: number;
    percentage: number;
  };
}

export function ListDrawerHeader({
  listName,
  progress,
}: ListDrawerHeaderProps) {
  return (
    <DrawerHeader>
      <DrawerTitle className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          {listName}
        </div>
        {progress.total > 0 && (
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2",
              getProgressColors(progress.percentage).progressColor
            )}
          >
            {progress.percentage}%
          </div>
        )}
      </DrawerTitle>
    </DrawerHeader>
  );
}
