import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  ShoppingCart,
  Package,
  ShoppingBag,
  Store,
  Tag,
  Gift,
  Heart,
  Star,
  Zap,
  Coffee,
  Apple,
  Carrot,
  Milk,
  Egg,
  Utensils,
  ChefHat,
} from "lucide-react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper function to get progress colors based on percentage
export function getProgressColors(percentage: number) {
  if (percentage === 100) {
    return {
      textColor: "text-green-600",
      progressColor: "bg-green-500",
    };
  } else if (percentage > 0 && percentage < 100) {
    return {
      textColor: "text-orange-600",
      progressColor: "bg-orange-500",
    };
  } else {
    return {
      textColor: "text-gray-600",
      progressColor: "bg-gray-300 dark:bg-gray-600",
    };
  }
}

export function getTimeBasedGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// Function to get an icon and color based on sequence/order
export function getSequentialIcon(index: number) {
  const iconConfigs = [
    { icon: "ShoppingCart", color: "text-blue-600" },
    { icon: "Package", color: "text-orange-600" },
    { icon: "ShoppingBag", color: "text-green-600" },
    { icon: "Store", color: "text-purple-600" },
    { icon: "Tag", color: "text-pink-600" },
    { icon: "Gift", color: "text-red-600" },
    { icon: "Heart", color: "text-destructive" },
    { icon: "Star", color: "text-yellow-500" },
    { icon: "Zap", color: "text-yellow-400" },
    { icon: "Coffee", color: "text-amber-700" },
    { icon: "Apple", color: "text-red-600" },
    { icon: "Carrot", color: "text-orange-500" },
    { icon: "Milk", color: "text-gray-300" },
    { icon: "Egg", color: "text-yellow-400" },
    { icon: "Utensils", color: "text-gray-600" },
    { icon: "ChefHat", color: "text-gray-400" },
  ];

  // Use modulo to cycle through icons if there are more lists than icons
  const iconIndex = index % iconConfigs.length;
  return iconConfigs[iconIndex];
}

// Icon mapping for the sequential icon function
export const iconMap = {
  ShoppingCart,
  Package,
  ShoppingBag,
  Store,
  Tag,
  Gift,
  Heart,
  Star,
  Zap,
  Coffee,
  Apple,
  Carrot,
  Milk,
  Egg,
  Utensils,
  ChefHat,
};
