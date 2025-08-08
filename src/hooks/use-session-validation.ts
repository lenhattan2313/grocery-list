"use client";

import { useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function useSessionValidation() {
  const { data: session } = useSession();
  const router = useRouter();

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
          router.push("/signin");
          return false;
        }
      }

      return response.ok;
    } catch (error) {
      console.error("Session validation failed:", error);
      return false;
    }
  }, [session?.user?.id, router]);

  return {
    validateSession,
    isAuthenticated: !!session?.user?.id,
  };
}
