"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/IconWrapper";
import { Button } from "@/components/ui/button";

interface RateLimitViewProps {
  retryAfter?: number | null;
  homeHref?: string;
  homeLabel?: string;
  showGoBack?: boolean;
}

export default function RateLimitView({
  retryAfter,
  homeHref = "/",
  homeLabel = "Take me home",
  showGoBack = true,
}: RateLimitViewProps) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(
    retryAfter ?? null,
  );

  useEffect(() => {
    if (!retryAfter) return;
    setSecondsLeft(retryAfter);
    const id = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [retryAfter]);

  const formatWait = (s: number) =>
    s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;

  return (
    <section className="bg-primary-bg">
      <div className="container mx-auto px-6 py-12">
        <div className="min-h-[calc(100vh-8rem)] lg:flex lg:items-center lg:gap-12">
          <div className="w-full lg:w-1/2">
            <h1 className="text-primary-text text-2xl font-semibold md:text-3xl">
              You&apos;re being rate limited
            </h1>
            <p className="text-secondary-text mt-4">
              You&apos;ve made too many requests. Please wait before trying
              again.
            </p>

            {secondsLeft !== null && secondsLeft > 0 && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 shrink-0"
                  viewBox="0 0 24 24"
                >
                  <g>
                    <path fill="currentColor" d="M7 3H17V7.2L12 12L7 7.2V3Z">
                      <animate
                        id="SVGFjnOndxt"
                        fill="freeze"
                        attributeName="opacity"
                        begin="0;SVGn6mLadge.end"
                        dur="2s"
                        from="1"
                        to="0"
                      />
                    </path>
                    <path
                      fill="currentColor"
                      d="M17 21H7V16.8L12 12L17 16.8V21Z"
                    >
                      <animate
                        fill="freeze"
                        attributeName="opacity"
                        begin="0;SVGn6mLadge.end"
                        dur="2s"
                        from="0"
                        to="1"
                      />
                    </path>
                    <path
                      fill="currentColor"
                      d="M6 2V8H6.01L6 8.01L10 12L6 16L6.01 16.01H6V22H18V16.01H17.99L18 16L14 12L18 8.01L17.99 8H18V2H6ZM16 16.5V20H8V16.5L12 12.5L16 16.5ZM12 11.5L8 7.5V4H16V7.5L12 11.5Z"
                    />
                    <animateTransform
                      id="SVGn6mLadge"
                      attributeName="transform"
                      attributeType="XML"
                      begin="SVGFjnOndxt.end"
                      dur="0.5s"
                      from="0 12 12"
                      to="180 12 12"
                      type="rotate"
                    />
                  </g>
                </svg>
                <span className="text-primary-text">
                  Try again in{" "}
                  <span className="font-semibold tabular-nums">
                    {formatWait(secondsLeft)}
                  </span>
                </span>
              </div>
            )}

            {secondsLeft === 0 && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm">
                <Icon
                  icon="material-symbols:check-circle-outline-rounded"
                  className="text-primary-text h-4 w-4 shrink-0"
                  inline
                />
                <span className="text-primary-text font-medium">
                  You can try again now
                </span>
              </div>
            )}

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

          <div className="relative mt-12 flex w-full items-center justify-center lg:mt-0 lg:w-1/2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="text-secondary-text h-48 w-48 opacity-20"
              viewBox="0 0 24 24"
            >
              <g>
                <path fill="currentColor" d="M7 3H17V7.2L12 12L7 7.2V3Z">
                  <animate
                    id="SVGFjnOndxt2"
                    fill="freeze"
                    attributeName="opacity"
                    begin="0;SVGn6mLadge2.end"
                    dur="2s"
                    from="1"
                    to="0"
                  />
                </path>
                <path fill="currentColor" d="M17 21H7V16.8L12 12L17 16.8V21Z">
                  <animate
                    fill="freeze"
                    attributeName="opacity"
                    begin="0;SVGn6mLadge2.end"
                    dur="2s"
                    from="0"
                    to="1"
                  />
                </path>
                <path
                  fill="currentColor"
                  d="M6 2V8H6.01L6 8.01L10 12L6 16L6.01 16.01H6V22H18V16.01H17.99L18 16L14 12L18 8.01L17.99 8H18V2H6ZM16 16.5V20H8V16.5L12 12.5L16 16.5ZM12 11.5L8 7.5V4H16V7.5L12 11.5Z"
                />
                <animateTransform
                  id="SVGn6mLadge2"
                  attributeName="transform"
                  attributeType="XML"
                  begin="SVGFjnOndxt2.end"
                  dur="0.5s"
                  from="0 12 12"
                  to="180 12 12"
                  type="rotate"
                />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
