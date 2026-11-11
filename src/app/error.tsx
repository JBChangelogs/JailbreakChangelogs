"use client";

import ErrorDigest from "@/components/ui/ErrorDigest";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import { reportAppError } from "@/utils/analytics/reportAppError";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => reportAppError(error, "root"), [error]);

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
              Page error
            </p>
            <h1 className="text-primary-text mt-3 text-2xl font-semibold md:text-3xl">
              This page couldn&apos;t load
            </h1>
            <p className="text-secondary-text mt-4">
              Try again, or return to the home page.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button
                variant="secondary"
                // No digest = client-side error; a soft refresh keeps the broken JS, so reload.
                onClick={error.digest ? retry : () => window.location.reload()}
                className="w-full sm:w-auto"
              >
                <Icon icon="heroicons-outline:arrow-path" className="h-5 w-5" />
                <span>Try again</span>
              </Button>
              <Button asChild className="w-full sm:w-auto">
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
