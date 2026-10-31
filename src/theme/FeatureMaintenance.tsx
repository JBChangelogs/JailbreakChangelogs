"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/IconWrapper";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FeatureMaintenanceProps {
  featureName?: string;
  customMessage?: string;
  siteWide?: boolean;
}

export default function FeatureMaintenance({
  featureName = "Feature",
  customMessage,
  siteWide = false,
}: FeatureMaintenanceProps = {}) {
  return (
    <section className="bg-primary-bg">
      <div className="container mx-auto px-6 py-12">
        <div
          className={`${siteWide ? "min-h-[calc(100vh-6rem)]" : "min-h-[calc(100vh-8rem)]"} flex flex-col lg:flex-row lg:items-center lg:gap-12`}
        >
          <div className="w-full lg:w-1/2">
            <p className="text-secondary-text text-sm font-medium">
              Temporarily unavailable
            </p>
            <h1 className="text-primary-text mt-3 text-2xl font-semibold md:text-3xl">
              {featureName}
            </h1>
            <p className="text-secondary-text mt-4">
              {customMessage ??
                `The ${featureName} is temporarily unavailable while we perform maintenance. Please try again later.`}
            </p>
            {!siteWide && (
              <p className="text-secondary-text mt-4">
                Other features of the site are still available.
              </p>
            )}

            {siteWide ? (
              <Button
                variant="default"
                size="md"
                asChild
                className="mt-6 w-full sm:w-auto"
              >
                <a
                  href="https://status.jailbreakchangelogs.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Check service status
                </a>
              </Button>
            ) : (
              <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
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
                  Go back
                </Button>
                <Button
                  variant="default"
                  size="md"
                  asChild
                  className="w-full sm:w-auto"
                >
                  <Link href="/">
                    <Icon icon="heroicons-outline:home" className="h-5 w-5" />
                    Take me home
                  </Link>
                </Button>
              </div>
            )}

            <div className="border-border-card mt-8 border-t pt-6">
              <h2 className="text-primary-text text-sm font-medium">
                Stay connected
              </h2>
              <p className="text-secondary-text mt-2 text-sm">
                Follow us for updates and announcements.
              </p>
              <div className="mt-4 flex flex-wrap gap-4">
                {[
                  {
                    label: "X",
                    href: "https://x.com/JBChangelogs",
                    icon: "bi:twitter-x",
                    tooltip: "Follow us on X",
                  },
                  {
                    label: "Discord",
                    href: "https://discord.jailbreakchangelogs.com",
                    icon: "ic:baseline-discord",
                    tooltip: "Join our Discord server",
                  },
                  {
                    label: "Roblox Group",
                    href: "https://www.roblox.com/communities/35348206/Jailbreak-Changelogs#!/about",
                    icon: "simple-icons:roblox",
                    tooltip: "Join our Roblox group",
                  },
                ].map(({ label, href, icon, tooltip }) => (
                  <Tooltip key={href}>
                    <TooltipTrigger asChild>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={label}
                        className="text-secondary-text hover:text-link focus-visible:ring-button-info inline-flex items-center justify-center rounded p-2 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                      >
                        <Icon icon={icon} className="h-5 w-5" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">{tooltip}</TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
          </div>

          <div
            className="order-first mb-6 flex w-full lg:order-last lg:mb-0 lg:w-1/2 lg:justify-center"
            aria-hidden="true"
          >
            <div className="text-secondary-text flex h-16 w-16 items-center justify-center lg:h-64 lg:w-64">
              <Icon
                icon="emojione-monotone:hammer-and-wrench"
                className="h-16 w-16 lg:h-32 lg:w-32"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
