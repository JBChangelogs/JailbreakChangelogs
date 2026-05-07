"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { createLogger } from "@/services/logger";

const log = createLogger("UI");

export default function ItemError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    log.error("Item page error", error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-md text-center">
        <h2 className="mb-2 text-2xl font-bold">Failed to load item</h2>
        <p className="text-secondary-text mb-6">
          Something went wrong loading this item. This may be a temporary issue.
        </p>

        <div className="space-y-4">
          <Button onClick={reset} className="w-full">
            Try Again
          </Button>
          <Button
            onClick={() => (window.location.href = "/values")}
            variant="outline"
            className="w-full"
          >
            Browse items
          </Button>
        </div>

        {process.env.NODE_ENV === "development" && (
          <details className="mt-6 text-left">
            <summary className="text-secondary-text cursor-pointer text-sm">
              Error Details (Development)
            </summary>
            <pre className="bg-tertiary-bg mt-2 overflow-auto rounded p-4 text-xs">
              {error.message}
              {error.stack && `\n\nStack trace:\n${error.stack}`}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
