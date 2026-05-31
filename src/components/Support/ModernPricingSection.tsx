"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useQueryState } from "nuqs";
import { toast } from "sonner";
import { getAllowedFileExtensions } from "@/config/settings";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Icon } from "@/components/ui/IconWrapper";
import ChangelogMediaEmbed from "@/components/Changelogs/ChangelogMediaEmbed";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { fetchSupporterGiftLevels } from "@/services/settingsService";
import { SupporterLevel } from "@/types/auth";
import { createLogger } from "@/services/logger";

const log = createLogger("UI");

interface SupporterTier {
  name: string;
  price: string;
  priceAlt?: string;
  features: string[];
  recommended?: boolean;
  tierNumber?: number;
}

const supporterTiers: SupporterTier[] = [
  {
    name: "Free",
    price: "$0",
    features: [
      "Post Comments up to 200 characters",
      "Monitor up to 3 OG Items",
      "Trade Ad Duration: 6 Hours",
      "Get your trade ads featured in our Discord for maximum reach.",
    ],
    tierNumber: 0,
  },
  {
    name: "Supporter I",
    price: "$0.99",
    priceAlt: "or 100R$ on Roblox",
    features: [
      "**All Free tier benefits**",
      "Post Comments up to 400 characters",
      "Monitor up to 5 OG Items",
      "Trade Ad Duration: +6 Hours (12 Hours total)",
      "Supporter badge next to your name in comments",
      "Discord Role: Supporter",
      "Get your trade ads featured in our Discord for maximum reach (highlighted to stand out)",
      "1 Extra entry in our Discord giveaways",
    ],
    tierNumber: 1,
  },
  {
    name: "Supporter II",
    price: "$2.99",
    priceAlt: "or 200R$ on Roblox",
    features: [
      "**All Supporter I benefits**",
      "Hide all advertisements",
      "Post Comments up to 800 characters",
      "Monitor up to 10 OG Items",
      "Trade Ad Duration: +12 Hours (24 Hours total)",
      `Upload and Use Custom Banners (${getAllowedFileExtensions()})`,
      `Upload and Use Custom Avatars (${getAllowedFileExtensions()})`,
      "Use inventory commands outside our Discord server",
      "2 Extra entries in our Discord giveaways",
    ],
    recommended: true,
    tierNumber: 2,
  },
  {
    name: "Supporter III",
    price: "$4.99",
    priceAlt: "or 400R$ on Roblox",
    features: [
      "**All Supporter II benefits**",
      "Post Comments up to 2,000 characters",
      "Monitor up to 15 OG Items",
      "Trade Ad Duration: +24 Hours (48 Hours total)",
      "Square Avatar Border",
      "On-Demand Inventory Refresh",
      "3 Extra entries in our Discord giveaways",
      "Bypass Discord Giveaway Requirements",
    ],
    tierNumber: 3,
  },
];

const CRYPTO_ADDRESSES = {
  BTC: "32d8fB55R4QCcg3KevrnjLHCfBwjgg1gE5",
  ETH: "0xDfc2427F6dFe87A52F7B127Bc08Beea689617BfB",
  LTC: "MMYQv8tBHRBbFhQnLaXUXfrjUz2XwCx4DK",
} as const;

export default function ModernPricingSection() {
  const BADGE_BASE_URL =
    "https://assets.jailbreakchangelogs.com/assets/website_icons";
  const [highlightedTier, setHighlightedTier] = useState<number | null>(null);
  const [discordLevels, setDiscordLevels] = useState<SupporterLevel[]>([]);
  const [discordLevelsLoading, setDiscordLevelsLoading] = useState(false);
  const [tabParam, setTabParam] = useQueryState("tab", {
    defaultValue: "",
    history: "push",
    shallow: true,
  });
  const [tierParam, setTierParam] = useQueryState("tier", {
    defaultValue: "",
    history: "push",
    shallow: true,
  });
  const { user } = useAuthContext();
  const { resolvedTheme } = useTheme();
  const isYearly = tabParam === "roblox";
  const isOwner = user?.flags?.some((f) => f.flag === "is_owner");

  const discordImagePath =
    resolvedTheme === "dark"
      ? "/support/discord/light-discord.png"
      : "/support/discord/dark-discord.png";

  const robloxImagePath =
    resolvedTheme === "dark"
      ? "/support/roblox/light-roblox.png"
      : "/support/roblox/dark-roblox.png";

  const copyToClipboard = async (address: string, cryptoType: string) => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success(`${cryptoType} wallet address copied to clipboard.`);
    } catch (err) {
      log.error("Failed to copy address:", err);
      toast.error(`Failed to copy ${cryptoType} wallet address.`);
    }
  };

  const copyTierLink = async (tierNumber: number, tierName: string) => {
    const url = new URL(window.location.href);
    const paymentMethodLabel = isYearly ? "Roblox" : "Discord";
    if (isYearly) {
      url.searchParams.set("tab", "roblox");
    } else {
      url.searchParams.delete("tab");
    }
    url.searchParams.set("tier", String(tierNumber));

    try {
      await navigator.clipboard.writeText(url.toString());
      toast.success("Link Copied", {
        description: `The ${paymentMethodLabel} URL for ${tierName} is now on your clipboard.`,
      });
    } catch (err) {
      log.error("Failed to copy tier link:", err);
      toast.error(`Failed to copy ${tierName} link.`);
    }
  };

  useEffect(() => {
    if (isYearly || discordLevels.length > 0 || discordLevelsLoading) return;
    setDiscordLevelsLoading(true);
    fetchSupporterGiftLevels()
      .then((levels) => setDiscordLevels(levels))
      .catch((err) => log.error("Failed to fetch discord levels", err))
      .finally(() => setDiscordLevelsLoading(false));
  }, [isYearly, discordLevels.length, discordLevelsLoading]);

  const discordSelfLevels = discordLevels.filter((l) => !l.is_gift);

  useEffect(() => {
    if (tierParam) {
      const tierNumber = parseInt(tierParam, 10);

      // Validate tier parameter (1, 2, or 3)
      if ([1, 2, 3].includes(tierNumber)) {
        // Set timeout to highlight the tier after a slight delay
        const timeoutId = setTimeout(() => {
          setHighlightedTier(tierNumber);

          // Clear highlight after 5 seconds
          setTimeout(() => {
            setHighlightedTier(null);
          }, 5000);
        }, 500); // 500ms delay

        // Clean up URL parameter after highlighting
        const clearParamTimeoutId = setTimeout(() => {
          void setTierParam(null);
        }, 2000); // Clean up after 2 seconds

        return () => {
          clearTimeout(timeoutId);
          clearTimeout(clearParamTimeoutId);
        };
      } else {
        // Invalid tier parameter, clean up URL
        void setTierParam(null);
      }
    }
  }, [tierParam, setTierParam]);

  return (
    <section className="bg-primary-bg">
      <div className="container mx-auto px-4 pt-2 pb-8 sm:px-6">
        <div>
          <div>
            <h2 className="text-primary-text text-2xl font-bold lg:text-3xl">
              Support Jailbreak Changelogs
            </h2>
            <p className="text-secondary-text mt-4 text-base sm:text-lg">
              <span className="text-button-info relative inline-block font-bold">
                One-time purchase
                <svg
                  className="absolute -bottom-1 left-0 hidden w-full sm:block"
                  viewBox="0 0 120 8"
                  preserveAspectRatio="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M0 4 Q 6 1, 12 4 T 24 4 T 36 4 T 48 4 T 60 4 T 72 4 T 84 4 T 96 4 T 108 4 T 120 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              . No subscriptions. No recurring fees. Keep perks forever.
            </p>
          </div>
        </div>

        <Tabs
          value={isYearly ? "roblox" : "discord"}
          onValueChange={(value) => {
            void setTabParam(value === "roblox" ? "roblox" : null);
          }}
          className="mt-6 w-full"
        >
          <TabsList fullWidth className="w-full">
            <TabsTrigger value="discord" fullWidth>
              Discord
            </TabsTrigger>
            <TabsTrigger value="roblox" fullWidth>
              Roblox
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="-mx-6 mt-12 grid gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4">
          {supporterTiers.map((tier) => (
            <div
              key={tier.name}
              className={`hover:bg-tertiary-bg transform rounded-lg px-6 py-4 transition-all duration-500 ${
                tier.recommended
                  ? "border-button-info bg-secondary-bg border-2"
                  : "border-border-card bg-secondary-bg border"
              }`}
              style={
                highlightedTier === tier.tierNumber
                  ? {
                      backgroundColor:
                        "color-mix(in srgb, var(--color-button-info), transparent 80%)",
                      transition: "background-color 0.5s ease",
                    }
                  : undefined
              }
            >
              <div className="mb-2 flex items-center gap-2">
                <p className="text-primary-text text-lg font-medium">
                  {tier.name}
                </p>
                {tier.recommended && (
                  <div className="bg-button-info rounded-full px-2 py-1 text-xs font-semibold text-white">
                    Popular
                  </div>
                )}
                {tier.name !== "Free" && tier.tierNumber && (
                  <Image
                    src={`${BADGE_BASE_URL}/jbcl_supporter_${tier.tierNumber}.svg`}
                    alt={tier.name}
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                )}
                {isOwner && tier.tierNumber ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() =>
                          copyTierLink(tier.tierNumber!, tier.name)
                        }
                        className="text-secondary-text hover:text-link cursor-pointer transition-colors"
                        aria-label={`Copy ${tier.name} link`}
                      >
                        <Icon icon="heroicons:link" className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="bg-secondary-bg text-primary-text border-none shadow-(--color-card-shadow)"
                    >
                      <p>Copy URL</p>
                    </TooltipContent>
                  </Tooltip>
                ) : null}
              </div>

              <h4 className="text-primary-text mt-2 text-3xl font-semibold">
                {tier.name === "Free" ? (
                  <div className="flex items-center gap-2">
                    <span>0</span>
                    <span className="text-secondary-text text-base font-normal">
                      {" "}
                      {isYearly ? "Robux" : "USD"}
                    </span>
                  </div>
                ) : isYearly && tier.priceAlt ? (
                  <div className="flex items-center gap-2">
                    <span>{tier.priceAlt.split(" ")[1].replace("R$", "")}</span>
                    <span className="text-secondary-text text-base font-normal">
                      {" "}
                      Robux
                    </span>
                  </div>
                ) : (
                  <>
                    {discordSelfLevels.find((l) => l.level === tier.tierNumber)
                      ?.price_str ?? "—"}
                    <span className="text-secondary-text text-base font-normal">
                      {" "}
                      USD
                    </span>
                  </>
                )}
              </h4>

              <p className="text-secondary-text mt-4">
                {tier.name === "Free"
                  ? "Free for all users, forever."
                  : "Unlock exclusive features and support the creators."}
              </p>

              <div className="mt-8 space-y-4">
                {tier.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-button-info h-5 w-5 shrink-0"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span
                      className={`text-secondary-text mx-4 ${feature.startsWith("**") ? "text-primary-text font-bold" : ""}`}
                    >
                      {feature.replace(/\*\*/g, "")}
                    </span>
                  </div>
                ))}
              </div>

              {tier.name !== "Free" ? (
                <Button
                  onClick={() => {
                    if (isYearly) {
                      window.open(
                        "https://www.roblox.com/games/104188650191561/Support-Us",
                        "_blank",
                        "noopener,noreferrer",
                      );
                    } else {
                      const level = discordSelfLevels.find(
                        (l) => l.level === tier.tierNumber,
                      );
                      if (level?.url) {
                        window.open(level.url, "_blank", "noopener,noreferrer");
                      }
                    }
                  }}
                  disabled={!isYearly && discordLevelsLoading}
                  className="mt-10 w-full tracking-wide capitalize"
                >
                  {isYearly
                    ? "Support with Robux"
                    : discordLevelsLoading
                      ? "Loading..."
                      : "Support with Discord"}
                </Button>
              ) : (
                <div className="border-border-card bg-tertiary-bg text-primary-text mt-10 w-full rounded-md border px-4 py-2 text-center font-medium tracking-wide capitalize">
                  Already included
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Important Information Section */}
        <div
          id="important-information"
          className="bg-button-info/10 border-border-card mt-12 scroll-mt-24 rounded-lg border p-6"
        >
          <h3 className="text-primary-text mb-4 text-lg font-semibold">
            Important Information
          </h3>

          <div className="grid gap-2">
            <div className="bg-primary-bg/60 border-border-card rounded-lg border p-4">
              <p className="text-primary-text text-sm font-semibold">
                One-time Purchases
              </p>
              <p className="text-secondary-text mt-1 text-sm">
                All supporter purchases are one-time and non-refundable. Once
                purchased, you keep the perks forever.
              </p>
            </div>

            <div className="bg-primary-bg/60 border-border-card rounded-lg border p-4">
              <p className="text-primary-text text-sm font-semibold">
                Discord Purchases
              </p>
              <p className="text-secondary-text mt-1 text-sm">
                Supporter tiers are purchased directly through Discord. Click{" "}
                <span className="text-primary-text font-semibold">
                  &quot;Support with Discord&quot;
                </span>{" "}
                on any tier above to be taken to the purchase page. Need help?
                Join our{" "}
                <a
                  href="https://discord.jailbreakchangelogs.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link hover:text-link-hover font-semibold underline transition-colors"
                >
                  Discord server
                </a>
                .
              </p>
            </div>

            <div className="bg-primary-bg/60 border-border-card rounded-lg border p-4">
              <p className="text-primary-text text-sm font-semibold">
                After You Purchase
              </p>
              <p className="text-secondary-text mt-1 text-sm">
                Your supporter tier is applied automatically after purchase — no
                code or extra steps needed.
              </p>
            </div>

            <div className="bg-primary-bg/60 border-border-card rounded-lg border p-4">
              <p className="text-primary-text text-sm font-semibold">
                Need Help?
              </p>
              <p className="text-secondary-text mt-1 text-sm">
                Didn&apos;t receive your supporter tier or need donation help?
                Join our{" "}
                <a
                  href="https://discord.jailbreakchangelogs.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link hover:text-link-hover font-semibold underline transition-colors"
                >
                  Discord
                </a>{" "}
                or email{" "}
                <a
                  href="mailto:support@jailbreakchangelogs.com"
                  className="text-link hover:text-link-hover font-semibold underline transition-colors"
                >
                  support@jailbreakchangelogs.com
                </a>
                .
              </p>
            </div>
          </div>
        </div>

        {/* Support Methods */}
        <div className="support-methods-section mt-12 grid gap-8 md:grid-cols-3">
          <div className="border-border-card bg-secondary-bg flex flex-col items-center justify-center rounded-lg border p-6 text-center">
            <h3 className="text-primary-text mb-4 text-lg font-semibold">
              Discord Purchases
            </h3>
            <p className="text-secondary-text mb-4 text-sm">
              Pay with USD through Discord for supporter perks.
            </p>
            <div className="flex flex-1 items-center justify-center">
              <ChangelogMediaEmbed
                type="image"
                url={discordImagePath}
                showUrl={false}
                wrapperClassName="mx-auto h-60 w-60"
              />
            </div>
            <a
              href="https://discord.com/discovery/applications/1281308669299920907/store"
              target="_blank"
              rel="noopener noreferrer"
              className="text-link hover:text-link-hover mt-4 inline-block text-sm underline"
            >
              Can&apos;t scan? Click here
            </a>
          </div>

          <div className="border-border-card bg-secondary-bg flex flex-col items-center justify-center rounded-lg border p-6 text-center">
            <h3 className="text-primary-text mb-4 text-lg font-semibold">
              Roblox Donations
            </h3>
            <p className="text-secondary-text mb-4 text-sm">
              Pay with Robux through Roblox for supporter perks.
            </p>
            <div className="flex flex-1 items-center justify-center">
              <ChangelogMediaEmbed
                type="image"
                url={robloxImagePath}
                showUrl={false}
                wrapperClassName="mx-auto h-60 w-60"
              />
            </div>
            <a
              href="https://www.roblox.com/games/104188650191561/Support-Us"
              target="_blank"
              rel="noopener noreferrer"
              className="text-link hover:text-link-hover mt-4 inline-block text-sm underline"
            >
              Can&apos;t scan? Click here
            </a>
          </div>

          <div className="border-border-card bg-secondary-bg rounded-lg border p-6 text-center">
            <h3 className="text-primary-text mb-4 text-lg font-semibold">
              Crypto Donations
            </h3>
            <p className="text-secondary-text mb-4 text-sm">
              Send BTC, ETH, or LTC directly to support with crypto.
            </p>
            <div className="space-y-4">
              <div className="border-border-card bg-tertiary-bg rounded-lg border p-4">
                <div className="text-primary-text mb-2 flex items-center justify-center gap-2">
                  <Icon
                    icon="token-branded:ltc"
                    className="h-4 w-4"
                    inline={true}
                  />
                  <span className="font-semibold">Litecoin (LTC)</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(CRYPTO_ADDRESSES.LTC, "LTC")}
                  className="text-secondary-text hover:text-primary-text w-full cursor-pointer text-center text-xs break-all transition-colors"
                  title="Copy Litecoin address"
                >
                  <code>{CRYPTO_ADDRESSES.LTC}</code>
                </button>
              </div>

              <div className="border-border-card bg-tertiary-bg rounded-lg border p-4">
                <div className="text-primary-text mb-2 flex items-center justify-center gap-2">
                  <Icon
                    icon="logos:ethereum"
                    className="h-4 w-4"
                    inline={true}
                  />
                  <span className="font-semibold">Ethereum (ETH)</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(CRYPTO_ADDRESSES.ETH, "ETH")}
                  className="text-secondary-text hover:text-primary-text w-full cursor-pointer text-center text-xs break-all transition-colors"
                  title="Copy Ethereum address"
                >
                  <code>{CRYPTO_ADDRESSES.ETH}</code>
                </button>
              </div>

              <div className="border-border-card bg-tertiary-bg rounded-lg border p-4">
                <div className="text-primary-text mb-2 flex items-center justify-center gap-2">
                  <Icon
                    icon="logos:bitcoin"
                    className="h-4 w-4"
                    inline={true}
                  />
                  <span className="font-semibold">Bitcoin (BTC)</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(CRYPTO_ADDRESSES.BTC, "BTC")}
                  className="text-secondary-text hover:text-primary-text w-full cursor-pointer text-center text-xs break-all transition-colors"
                  title="Copy Bitcoin address"
                >
                  <code>{CRYPTO_ADDRESSES.BTC}</code>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Long-term Sponsor Section */}
        <div className="border-border-card bg-secondary-bg mt-12 rounded-lg border p-4">
          <div className="text-center">
            <h3 className="text-primary-text mb-2 text-lg font-semibold">
              Want to become a long-term sponsor?
            </h3>
            <p className="text-secondary-text mb-3 text-sm">
              Reach out via email:{" "}
              <a
                href="mailto:support@jailbreakchangelogs.com"
                className="text-link hover:text-link-hover font-semibold underline transition-colors"
              >
                support@jailbreakchangelogs.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
