"use client";

import { useState, useEffect } from "react";

/**
 * A hook to determine if the component has been hydrated.
 * This is useful for preventing server-client mismatches.
 * @returns {boolean} - True if the component has been hydrated, false otherwise.
 */
export function useHydration() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}
