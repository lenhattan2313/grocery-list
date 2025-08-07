import { useRef, useEffect, useCallback } from "react";

interface UseMobileKeyboardOptions {
  /**
   * Delay before scrolling into view (ms)
   * @default 100
   */
  scrollDelay?: number;
  /**
   * Scroll behavior
   * @default "smooth"
   */
  scrollBehavior?: ScrollBehavior;
  /**
   * Scroll block alignment
   * @default "center"
   */
  scrollBlock?: ScrollLogicalPosition;
  /**
   * Whether to enable viewport change detection
   * @default true
   */
  enableViewportDetection?: boolean;
}

/**
 * Hook to handle mobile keyboard interactions and auto-scroll input/textarea into view
 */
export function useMobileKeyboard<
  T extends HTMLInputElement | HTMLTextAreaElement = HTMLInputElement
>(options: UseMobileKeyboardOptions = {}) {
  const {
    scrollDelay = 100,
    scrollBehavior = "smooth",
    scrollBlock = "center",
    enableViewportDetection = true,
  } = options;

  const inputRef = useRef<T>(null);

  const scrollIntoView = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.scrollIntoView({
        behavior: scrollBehavior,
        block: scrollBlock,
        inline: "nearest",
      });
    }
  }, [scrollBehavior, scrollBlock]);

  const handleFocus = useCallback(() => {
    // Small delay to ensure the keyboard animation has started
    setTimeout(scrollIntoView, scrollDelay);
  }, [scrollIntoView, scrollDelay]);

  // Handle viewport changes when keyboard appears/disappears
  useEffect(() => {
    if (!enableViewportDetection) return;

    const handleViewportChange = () => {
      if (inputRef.current && document.activeElement === inputRef.current) {
        // Re-scroll the input into view when viewport changes
        setTimeout(scrollIntoView, scrollDelay + 50);
      }
    };

    // Listen for viewport changes (keyboard show/hide)
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleViewportChange);

      return () => {
        window.visualViewport?.removeEventListener(
          "resize",
          handleViewportChange
        );
      };
    }
  }, [enableViewportDetection, scrollIntoView, scrollDelay]);

  return {
    inputRef,
    handleFocus,
    scrollIntoView,
  };
}
