"use client";

import { useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { toast } from "sonner";

export function useSessionValidation() {
  const { data: session } = useSession();

  const validateSession = useCallback(async () => {
    if (!session?.user?.id) {
      return false;
    }

    try {
      const response = await fetch("/api/auth/validate", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();

        if (data.requiresReauth) {
          toast.error("Database has been updated. Please sign in again.");
          await signOut({ redirect: true, callbackUrl: "/signin" });
          return false;
        }
      }

      return response.ok;
    } catch (error) {
      console.error("Session validation failed:", error);
      return false;
    }
  }, [session?.user?.id]);

  return {
    validateSession,
    isAuthenticated: !!session?.user?.id,
  };
}
