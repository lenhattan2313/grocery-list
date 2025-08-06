"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Moon, Sun, Monitor } from "lucide-react";

interface ThemeSwitchProps {
  value: "light" | "dark" | "system";
  onValueChange: (value: "light" | "dark" | "system") => void;
  className?: string;
}

export function ThemeSwitch({
  value,
  onValueChange,
  className,
}: ThemeSwitchProps) {
  const options = [
    { value: "light" as const, label: "Light", icon: Sun },
    { value: "dark" as const, label: "Dark", icon: Moon },
    { value: "system" as const, label: "Auto", icon: Monitor },
  ];

  return (
    <div
      className={cn(
        "inline-flex h-10 rounded-lg bg-gray-100 dark:bg-input/30 p-1",
        className
      )}
    >
      {options.map((option) => {
        const Icon = option.icon;
        const isSelected = value === option.value;

        return (
          <button
            key={option.value}
            onClick={() => onValueChange(option.value)}
            className={cn(
              "inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ease-in-out",
              "hover:bg-gray-200 dark:hover:bg-gray-700",
              isSelected
                ? "bg-white text-gray-900 dark:bg-input/30 dark:text-gray-100 shadow-sm"
                : "text-gray-600 dark:text-gray-400"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
