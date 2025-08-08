"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useSessionValidation } from "@/hooks/use-session-validation";

interface SessionValidatorProps {
  children: React.ReactNode;
}

export function SessionValidator({ children }: SessionValidatorProps) {
  const { data: session, status } = useSession();
  const { validateSession } = useSessionValidation();
  const hasValidated = useRef(false);

  useEffect(() => {
    // Only validate once when session is loaded and user is authenticated
    if (
      status === "authenticated" &&
      session?.user?.id &&
      !hasValidated.current
    ) {
      hasValidated.current = true;
      validateSession();
      console.log("Session validated");
    }
  }, [status, session?.user?.id, validateSession]);

  // Reset validation flag when session changes
  useEffect(() => {
    if (status === "unauthenticated") {
      hasValidated.current = false;
    }
  }, [status]);

  return <>{children}</>;
}
