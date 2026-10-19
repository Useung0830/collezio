"use client";

import type { ReactNode } from "react";
import { Suspense } from "react";
import { QueryErrorResetBoundary } from "@tanstack/react-query";

import QueryErrorBoundary from "./QueryErrorBoundary";

type QuerySuspenseBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
  renderError: (error: Error, retry: () => void) => ReactNode;
};

export default function QuerySuspenseBoundary({
  children,
  fallback,
  renderError,
}: QuerySuspenseBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <QueryErrorBoundary onReset={reset} renderError={renderError}>
          <Suspense fallback={fallback}>{children}</Suspense>
        </QueryErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
