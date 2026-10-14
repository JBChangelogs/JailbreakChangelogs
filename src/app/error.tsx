"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import NotFoundIllustration from "@/components/ui/NotFoundIllustration";
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
        <div className="min-h-[calc(100vh-8rem)] lg:flex lg:items-center lg:gap-12">
          <div className="w-full lg:w-1/2">
            <p className="text-secondary-text text-sm font-medium">
              Page error
            </p>
            <h1 className="text-primary-text mt-3 text-2xl font-semibold md:text-3xl">
              This page couldn&apos;t load
            </h1>
            <p className="text-secondary-text mt-4">
              Try again, or return to the home page.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
              <Button
                variant="secondary"
                onClick={retry}
                className="w-full sm:w-auto"
              >
                <Icon icon="heroicons-outline:arrow-path" className="h-5 w-5" />
                <span>Try again</span>
              </Button>
              <Button asChild className="w-full sm:w-auto">
                <Link href="/">
                  <Icon
                    icon="heroicons-outline:arrow-left"
                    className="h-5 w-5"
                  />
                  <span>Back to home</span>
                </Link>
              </Button>
            </div>
          </div>
          <div className="relative mt-12 w-full lg:mt-0 lg:w-1/2">
            <NotFoundIllustration
              className="w-full max-w-lg lg:mx-auto"
              alt="Error illustration"
              width={500}
              height={400}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
