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
   * Whether to enable viewport change detection
   * @default true
   */
  enableViewportDetection?: boolean;
}

/**
 * Hook to handle mobile keyboard interactions and auto-scroll input into view
 */
export function useMobileKeyboard<
  T extends HTMLInputElement | HTMLTextAreaElement = HTMLInputElement
>(options: UseMobileKeyboardOptions = {}) {
  const {
    scrollDelay = 100,
    scrollBehavior = "smooth",
    enableViewportDetection = true,
  } = options;

  const inputRef = useRef<T>(null);

  // Check if element is visible in viewport
  const isElementVisible = useCallback((element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // Check if element is within the visible viewport
    return rect.top >= 0 && rect.bottom <= viewportHeight;
  }, []);

  // Scroll viewport to make input visible
  const scrollViewportToInput = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // If input is below the visible area, scroll up
      if (rect.bottom > viewportHeight) {
        const scrollAmount = rect.bottom - viewportHeight + 20; // Add 20px padding
        window.scrollBy({
          top: scrollAmount,
          behavior: scrollBehavior,
        });
      }
      // If input is above the visible area, scroll down
      else if (rect.top < 0) {
        const scrollAmount = rect.top - 20; // Add 20px padding
        window.scrollBy({
          top: scrollAmount,
          behavior: scrollBehavior,
        });
      }
    }
  }, [scrollBehavior]);

  const handleFocus = useCallback(() => {
    // Small delay to ensure the keyboard animation has started
    setTimeout(() => {
      if (inputRef.current && !isElementVisible(inputRef.current)) {
        scrollViewportToInput();
      }
    }, scrollDelay);
  }, [scrollDelay, isElementVisible, scrollViewportToInput]);

  // Handle viewport changes when keyboard appears/disappears
  useEffect(() => {
    if (!enableViewportDetection) return;

    const handleViewportChange = () => {
      if (inputRef.current && document.activeElement === inputRef.current) {
        // When keyboard appears, check if input is still visible and scroll if needed
        setTimeout(() => {
          if (inputRef.current && !isElementVisible(inputRef.current)) {
            scrollViewportToInput();
          }
        }, scrollDelay + 100);
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
  }, [
    enableViewportDetection,
    scrollDelay,
    isElementVisible,
    scrollViewportToInput,
  ]);

  return {
    inputRef,
    handleFocus,
    scrollViewportToInput,
  };
}
