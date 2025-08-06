"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";

interface UseThemeReturn {
  theme: ThemeMode;
  resolvedTheme: "light" | "dark" | undefined;
  setTheme: (theme: ThemeMode) => void;
  mounted: boolean;
  isDark: boolean;
  isLight: boolean;
  isSystem: boolean;
}

export function useThemeEnhanced(): UseThemeReturn {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = (theme as ThemeMode) || "system";
  const isDark = mounted && resolvedTheme === "dark";
  const isLight = mounted && resolvedTheme === "light";
  const isSystem = mounted && currentTheme === "system";

  return {
    theme: currentTheme,
    resolvedTheme: mounted ? (resolvedTheme as "light" | "dark" | undefined) : undefined,
    setTheme: (newTheme: ThemeMode) => setTheme(newTheme),
    mounted,
    isDark,
    isLight,
    isSystem,
  };
}
