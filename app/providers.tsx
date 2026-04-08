"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <SessionProvider>{children}</SessionProvider>
    </ErrorBoundary>
  );
}

