"use client";

import { useEffect } from "react";

// Type definitions for PerformanceObserver entries
interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

interface FirstInputEntry extends PerformanceEntry {
  processingStart: number;
}

export function PerformanceMonitor() {
  useEffect(() => {
    if (typeof window !== "undefined" && "PerformanceObserver" in window) {
      // Monitor LCP (Largest Contentful Paint)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];

        // Send to analytics if needed
        if (lastEntry.startTime > 2500) {
          // LCP is too slow
        }
      });
      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });

      // Monitor FID (First Input Delay)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as FirstInputEntry[];
        entries.forEach((entry) => {
          if (entry.processingStart - entry.startTime > 100) {
            // FID is too slow
          }
        });
      });
      fidObserver.observe({ entryTypes: ["first-input"] });

      // Monitor CLS (Cumulative Layout Shift)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as LayoutShiftEntry[];
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;

            if (clsValue > 0.1) {
              // CLS is too high
            }
          }
        });
      });
      clsObserver.observe({ entryTypes: ["layout-shift"] });

      // Monitor FCP (First Contentful Paint)
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const firstEntry = entries[0];

        if (firstEntry.startTime > 1800) {
          // FCP is too slow
        }
      });
      fcpObserver.observe({ entryTypes: ["first-contentful-paint"] });

      return () => {
        lcpObserver.disconnect();
        fidObserver.disconnect();
        clsObserver.disconnect();
        fcpObserver.disconnect();
      };
    }
  }, []);

  return null;
}
