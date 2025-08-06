"use client";

import { Button } from "@/components/ui/button";
import { ChevronDown, Plus, Tag } from "lucide-react";
import { useState } from "react";

interface SuggestedItem {
  id: string;
  name: string;
}

interface SuggestedCategory {
  name: string;
  icon: string;
  items: SuggestedItem[];
}

interface SmartSuggestionsProps {
  onAddItem: (itemName: string) => void;
  existingItems: string[];
}

const suggestedCategories: SuggestedCategory[] = [
  {
    name: "Produce",
    icon: "🥕",
    items: [
      { id: "1", name: "Bananas" },
      { id: "2", name: "Mango" },
      { id: "3", name: "Pineapple" },
      { id: "4", name: "Tangerine" },
      { id: "5", name: "Watermelon" },
    ],
  },
  {
    name: "Dairy",
    icon: "🥛",
    items: [
      { id: "6", name: "Eggs" },
      { id: "7", name: "Yogurt" },
      { id: "8", name: "Fresh Milk" },
      { id: "9", name: "Condensed Milk" },
    ],
  },
  {
    name: "Pantry",
    icon: "🍞",
    items: [
      { id: "10", name: "Garlic" },
      { id: "11", name: "Onion" },
      { id: "12", name: "Flour" },
      { id: "13", name: "Sugar" },
      { id: "17", name: "Salt" },
    ],
  },
];

export function SmartSuggestions({
  onAddItem,
  existingItems,
}: SmartSuggestionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="p-4 space-y-4 text-card-foreground border rounded-lg bg-gray-50 dark:border-gray-600 dark:bg-transparent">
      <button
        className="flex items-start w-full gap-3 text-left"
        onClick={() => setIsExpanded((prev) => !prev)}
      >
        <div className="bg-blue-100 rounded-lg p-1.5">
          <Tag className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-gray-800 dark:text-gray-100">
            Popular by Category
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Common items you might need
          </p>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-gray-500 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {isExpanded && (
        <div className="space-y-4 pt-2">
          {suggestedCategories.map((category) => (
            <div key={category.name} className="space-y-3">
              <div className="flex items-center w-full gap-3">
                <span className="text-xl">{category.icon}</span>
                <h3 className="flex-1 font-semibold text-gray-700 dark:text-gray-100">
                  {category.name}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {category.items.map((item) => (
                  <Button
                    key={item.id}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1.5 bg-white"
                    onClick={() => onAddItem(item.name)}
                    disabled={existingItems.includes(item.name.toLowerCase())}
                  >
                    <Plus className="h-4 w-4 text-gray-500" />
                    {item.name}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
