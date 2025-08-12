"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import ChatGptLogo from "@/assets/ChatGPT_logo.png";

interface AnimatedChatGPTButtonProps {
  onClick: () => void;
  className?: string;
}

export function AnimatedChatGPTButton({
  onClick,
  className = "",
}: AnimatedChatGPTButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [expansionProgress, setExpansionProgress] = useState(0); // 0 = collapsed, 1 = fully expanded
  const animationRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Animation effect for ChatGPT button
  useEffect(() => {
    // Don't start animation if user is hovering
    if (isHovered) return;

    const animateExpansion = (
      startProgress: number,
      endProgress: number,
      duration: number
    ) => {
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function for smooth animation - using ease-in-out for smoother transitions
        const easeProgress =
          progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2; // Ease-in-out quadratic

        const currentProgress =
          startProgress + (endProgress - startProgress) * easeProgress;
        setExpansionProgress(currentProgress);

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    const startAnimation = () => {
      // Start collapsed
      setExpansionProgress(0);

      // After 1 second, start expanding (takes 3 seconds)
      animationRef.current = setTimeout(() => {
        if (!isHovered) {
          animateExpansion(0, 1, 3000); // 3 seconds to expand

          // After 3 seconds of expansion, start collapsing (takes 3 seconds)
          animationRef.current = setTimeout(() => {
            if (!isHovered) {
              animateExpansion(1, 0, 3000); // 3 seconds to collapse
              // Animation stops here - no restart
            }
          }, 3000);
        }
      }, 1000);
    };

    // Start the animation cycle (only once)
    startAnimation();

    // Cleanup on unmount
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isHovered]);

  return (
    <Button
      variant="outline"
      onClick={onClick}
      aria-label="Generate with AI"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`rounded-full hover:scale-105 hover:shadow-md ${className}`}
      style={{
        width: `${40 + expansionProgress * 120}px`,
        paddingLeft: `${8 + expansionProgress * 16}px`,
        paddingRight: `${8 + expansionProgress * 16}px`,
        transition: "none", // Disable CSS transition since we're using JS animation
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: `rgba(var(--border), ${0.5 + expansionProgress * 0.5})`,
        backgroundColor: `rgba(var(--background), ${
          0.8 + expansionProgress * 0.2
        })`,
        backdropFilter: expansionProgress > 0.1 ? "blur(4px)" : "none",
        overflow: "hidden", // Prevent content from going outside border
      }}
    >
      <div className="flex items-center gap-2 w-full">
        <Image
          src={ChatGptLogo}
          alt="ChatGPT logo"
          className="h-4 w-4 flex-shrink-0"
        />
        {expansionProgress > 0.1 && (
          <span
            className="text-sm font-medium whitespace-nowrap overflow-hidden"
            style={{
              opacity: expansionProgress,
              transform: `translateX(${(1 - expansionProgress) * -10}px)`,
              transition: "none",
              color: `rgba(var(--foreground), ${
                0.7 + expansionProgress * 0.3
              })`,
            }}
          >
            Ask ChatGPT
          </span>
        )}
      </div>
    </Button>
  );
}
