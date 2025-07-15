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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:relative md:border-t-0 md:bg-transparent md:fixed md:bottom-auto md:left-auto md:right-auto md:z-auto">
      <div className="flex justify-around md:justify-start md:space-x-8 md:mb-8">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center py-2 px-3 text-sm font-medium transition-colors md:flex-row md:py-2 md:px-4 md:rounded-lg",
                isActive
                  ? "text-primary bg-primary/10 md:bg-primary/10"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <item.icon className="h-6 w-6 md:h-5 md:w-5 md:mr-2" />
              <span className="mt-1 md:mt-0">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
