"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/IconWrapper";
import { Button } from "@/components/ui/button";
import { createLogger } from "@/services/logger";

const log = createLogger("UI");

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    log.error("Users error", error);
  }, [error]);

  return (
    <section className="bg-primary-bg">
      <div className="container mx-auto py-12">
        <div className="min-h-[calc(100vh-8rem)] lg:flex lg:items-center lg:gap-12">
          <div className="w-full lg:w-1/2">
            <p className="text-secondary-text text-sm font-medium">
              Users error
            </p>
            <h1 className="text-primary-text mt-3 text-2xl font-semibold md:text-3xl">
              Failed to load users
            </h1>
            <p className="text-secondary-text mt-4">
              Something went wrong while loading the users page.
            </p>

            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
              <Button
                variant="secondary"
                size="md"
                onClick={reset}
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
            <Image
              className="w-full max-w-lg lg:mx-auto"
              src="https://assets.jailbreakchangelogs.com/assets/images/404.svg"
              alt="Error illustration"
              width={500}
              height={400}
              loading="eager"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
