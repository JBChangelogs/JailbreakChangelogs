"use client";

import ErrorDigest from "@/components/ui/ErrorDigest";
import { useEffect } from "react";
import { Icon } from "@/components/ui/IconWrapper";
import { Button } from "@/components/ui/button";
import { reportAppError } from "@/utils/analytics/reportAppError";
import { createLogger } from "@/services/logger";

const log = createLogger("UI");

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    log.error("Leaderboard error", error);
    return reportAppError(error, "leaderboard/money");
  }, [error]);

  return (
    <section className="bg-primary-bg">
      <div className="container mx-auto px-6 py-12">
        <div className="flex min-h-[calc(100vh-8rem)] items-center">
          <div className="mx-auto w-full max-w-xl text-center">
            <Icon
              icon="heroicons:exclamation-triangle"
              className="text-secondary-text mx-auto mb-4 h-10 w-10"
            />
            <p className="text-secondary-text text-sm font-medium">
              Leaderboard error
            </p>
            <h1 className="text-primary-text mt-3 text-2xl font-semibold md:text-3xl">
              Failed to load leaderboard
            </h1>
            <p className="text-secondary-text mt-4">
              Something went wrong while loading the leaderboard.
            </p>

            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button
                variant="secondary"
                size="md"
                // No digest = client-side error; a soft refresh keeps the broken JS, so reload.
                onClick={error.digest ? retry : () => window.location.reload()}
                className="w-full sm:w-auto"
              >
                <Icon icon="heroicons-outline:arrow-path" className="h-5 w-5" />
                <span>Try again</span>
              </Button>

              <Button
                variant="default"
                size="md"
                asChild
                className="w-full sm:w-auto"
              >
                <a href="/">
                  <Icon
                    icon="heroicons-outline:arrow-left"
                    className="h-5 w-5"
                  />
                  <span>Back to home</span>
                </a>
              </Button>
            </div>
            <ErrorDigest digest={error.digest} />
          </div>
        </div>
      </div>
    </section>
  );
}
