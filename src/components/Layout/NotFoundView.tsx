"use client";

import Link from "next/link";
import Image from "next/image";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { Icon } from "@/components/ui/IconWrapper";
import { Button } from "@/components/ui/button";

interface NotFoundViewProps {
  eyebrow?: string;
  title?: string;
  description?: string;
  homeHref?: string;
  homeLabel?: string;
  showGoBack?: boolean;
  showBreadcrumb?: boolean;
}

export default function NotFoundView({
  eyebrow = "404 error",
  title = "Page not found",
  description = "Sorry, the page you are looking for doesn't exist. Here are some helpful links:",
  homeHref = "/",
  homeLabel = "Take me home",
  showGoBack = true,
  showBreadcrumb = false,
}: NotFoundViewProps) {
  return (
    <section className="bg-primary-bg">
      <div className="container mx-auto px-6 py-12">
        {showBreadcrumb && <Breadcrumb />}

        <div className="min-h-[calc(100vh-8rem)] lg:flex lg:items-center lg:gap-12">
          <div className="w-full lg:w-1/2">
            <p className="text-secondary-text text-sm font-medium">{eyebrow}</p>
            <h1 className="text-primary-text mt-3 text-2xl font-semibold md:text-3xl">
              {title}
            </h1>
            <p className="text-secondary-text mt-4">{description}</p>

            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
              {showGoBack && (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => window.history.back()}
                  className="w-full sm:w-auto"
                >
                  <Icon
                    icon="heroicons-outline:arrow-left"
                    className="h-5 w-5"
                  />
                  <span>Go back</span>
                </Button>
              )}

              <Button
                variant="default"
                size="md"
                asChild
                className="w-full sm:w-auto"
              >
                <Link href={homeHref}>
                  <Icon icon="heroicons-outline:home" className="h-5 w-5" />
                  {homeLabel}
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative mt-12 w-full lg:mt-0 lg:w-1/2">
            <Image
              className="w-full max-w-lg lg:mx-auto"
              src="https://assets.jailbreakchangelogs.com/assets/images/404.svg"
              alt="404 Error Illustration"
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
