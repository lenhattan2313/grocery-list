"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, ChefHat, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Lists", href: "/", icon: Home },
  { name: "Recipes", href: "/recipes", icon: ChefHat },
  { name: "Profile", href: "/profile", icon: User },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-background border-t border-border dark:border-gray-700">
      <div className="flex justify-around md:justify-center md:space-x-8 md:mb-8">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center py-2 px-3 text-sm transition-colors md:flex-row md:py-2 md:px-4 md:rounded-lg",
                isActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="flex items-center justify-center w-10 h-6 md:w-8 md:h-6 md:mr-2">
                <item.icon className="h-5 w-5 md:h-4 md:w-4" />
              </div>
              <span className="mt-1 md:mt-0">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
