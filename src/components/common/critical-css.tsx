"use client";

import { useEffect } from "react";

// Static critical CSS that should be available immediately
export const STATIC_CRITICAL_CSS = `
  /* Critical theme variables */
  :root {
    --radius: 0.625rem;
    --background: oklch(1 0 0);
    --foreground: oklch(0.145 0 0);
    --card: oklch(1 0 0);
    --card-foreground: oklch(0.145 0 0);
    --popover: oklch(1 0 0);
    --popover-foreground: oklch(0.145 0 0);
    --primary: oklch(0.205 0 0);
    --primary-foreground: oklch(0.985 0 0);
    --secondary: oklch(0.97 0 0);
    --secondary-foreground: oklch(0.205 0 0);
    --muted: oklch(0.97 0 0);
    --muted-foreground: oklch(0.556 0 0);
    --accent: oklch(0.97 0 0);
    --accent-foreground: oklch(0.205 0 0);
    --destructive: oklch(0.577 0.245 27.325);
    --border: oklch(0.922 0 0);
    --input: oklch(0.922 0 0);
    --ring: oklch(0.708 0 0);
  }

  .dark {
    --background: oklch(0.145 0 0);
    --foreground: oklch(0.985 0 0);
    --card: oklch(0.205 0 0);
    --card-foreground: oklch(0.985 0 0);
    --popover: oklch(0.205 0 0);
    --popover-foreground: oklch(0.985 0 0);
    --primary: oklch(0.922 0 0);
    --primary-foreground: oklch(0.205 0 0);
    --secondary: oklch(0.269 0 0);
    --secondary-foreground: oklch(0.985 0 0);
    --muted: oklch(0.269 0 0);
    --muted-foreground: oklch(0.708 0 0);
    --accent: oklch(0.269 0 0);
    --accent-foreground: oklch(0.985 0 0);
    --destructive: oklch(0.704 0.191 22.216);
    --border: oklch(1 0 0 / 10%);
    --input: oklch(1 0 0 / 15%);
    --ring: oklch(0.556 0 0);
  }

  /* Critical interactive styles */
  .focus\\:outline-none:focus { outline: 2px solid transparent; outline-offset: 2px; }
  .focus\\:ring-2:focus { --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color); --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color); box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000); }
  .focus\\:ring-ring:focus { --tw-ring-color: oklch(0.708 0 0); }
`;

// Component for dynamic CSS that needs to be injected after hydration
export function DynamicCSS() {
  useEffect(() => {
    // Only inject dynamic styles that depend on user preferences or runtime conditions
    const dynamicStyles = `
      /* Dynamic styles that change based on user preferences */
      /* Add any user-specific styles here */
    `;

    // Only inject if there are actual dynamic styles
    if (dynamicStyles.trim()) {
      const style = document.createElement("style");
      style.textContent = dynamicStyles;
      style.setAttribute("data-dynamic-critical", "true");
      document.head.appendChild(style);

      return () => {
        const existingStyle = document.querySelector(
          'style[data-dynamic-critical="true"]'
        );
        if (existingStyle) {
          existingStyle.remove();
        }
      };
    }
  }, []);

  return null;
}

// Legacy component for backward compatibility
export function CriticalCSS() {
  return <DynamicCSS />;
}
