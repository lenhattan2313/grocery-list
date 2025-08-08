"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { SessionValidator } from "@/components/common/session-validator";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider>
      <SessionValidator>{children}</SessionValidator>
    </SessionProvider>
  );
}
