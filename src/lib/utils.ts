import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
      progressColor: "bg-gray-500",
    };
  }
}
