"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface SplashScreenProps {
  children: React.ReactNode;
}

export function SplashScreen({ children }: SplashScreenProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Show splash screen for at least 1 second
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-black flex items-center justify-center z-50">
        <div className="text-center space-y-4">
          {/* App Icon */}
          <div className="relative">
            <div className="w-24 h-24 mx-auto">
              <Image
                src="/icon512_rounded.png"
                alt="Grocery App Icon"
                width={96}
                height={96}
                className="w-full h-full object-contain"
                priority
              />
            </div>
          </div>

          {/* App Name */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Grocery App
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Smart Shopping Lists & Recipes
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
