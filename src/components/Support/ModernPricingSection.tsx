"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { getAllowedFileExtensions } from "@/config/settings";
import { useTheme } from "@/contexts/ThemeContext";
import { Icon } from "@/components/ui/IconWrapper";
import ImageModal from "@/components/ui/ImageModal";

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
      "Trade Ad Duration: 6 Hours",
      "Get your trade ads featured in our Discord for maximum reach.",
    ],
    tierNumber: 0,
  },
  {
    name: "Supporter I",
    price: "$1",
    priceAlt: "or 100R$ on Roblox",
    features: [
      "**All Free tier benefits**",
      "Post Comments up to 400 characters",
      "Trade Ad Duration: +6 Hours (12 Hours total)",
      "Custom Supporter Badge",
      "Discord Role: Supporter",
      "Comments highlighted with Bronze border and badge",
      "Get your trade ads featured in our Discord for maximum reach (highlighted to stand out)",
      "1 Extra entry in our Discord giveaways",
    ],
    tierNumber: 1,
  },
  {
    name: "Supporter II",
    price: "$3",
    priceAlt: "or 200R$ on Roblox",
    features: [
      "**All Supporter I benefits**",
      "Hide all advertisements",
      "Post Comments up to 800 characters",
      "Trade Ad Duration: +12 Hours (24 Hours total)",
      `Upload and Use Custom Banners (${getAllowedFileExtensions()})`,
      `Upload and Use Custom Avatars (${getAllowedFileExtensions()})`,
      "Use inventory commands outside our Discord server",
      "Comments highlighted with Silver border and badge",
      "2 Extra entries in our Discord giveaways",
    ],
    recommended: true,
    tierNumber: 2,
  },
  {
    name: "Supporter III",
    price: "$5",
    priceAlt: "or 400R$ on Roblox",
    features: [
      "**All Supporter II benefits**",
      "Post Comments up to 2,000 characters",
      "Trade Ad Duration: +24 Hours (48 Hours total)",
      "Comments highlighted with Gold border and badge",
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
    "https://assets.jailbreakchangelogs.xyz/assets/website_icons";
  const [isYearly, setIsYearly] = useState(false);
  const [highlightedTier, setHighlightedTier] = useState<number | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { resolvedTheme } = useTheme();

  // Dynamic image paths based on theme
  const kofiImagePath =
    resolvedTheme === "dark"
      ? "/support/kofi/dark/kofi-dark.png"
      : "/support/kofi/kofi-light.png";

  const robloxImagePath =
    resolvedTheme === "dark"
      ? "/support/roblox/dark/roblox-dark.png"
      : "/support/roblox/roblox-light.png";

  const copyToClipboard = async (address: string, cryptoType: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(cryptoType);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  };

  useEffect(() => {
    const tierParam = searchParams.get("tier");

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
        setTimeout(() => {
          router.replace("/supporting", { scroll: false });
        }, 2000); // Clean up after 2 seconds

        return () => clearTimeout(timeoutId);
      } else {
        // Invalid tier parameter, clean up URL
        router.replace("/supporting", { scroll: false });
      }
    }
  }, [searchParams, router]);

  return (
    <section className="bg-primary-bg">
      <div className="container mx-auto px-4 pt-2 pb-8 sm:px-6">
        <div className="sm:flex sm:items-center sm:justify-between">
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

          <div className="border-border-primary mt-6 overflow-hidden rounded-lg border p-0.5">
            <div className="flex sm:-mx-0.5">
              <button
                onClick={() => setIsYearly(false)}
                className={`w-1/2 cursor-pointer rounded-lg px-3 py-1 transition-colors focus:outline-none sm:mx-0.5 sm:w-auto ${
                  !isYearly
                    ? "bg-button-info text-white"
                    : "bg-secondary-bg text-secondary-text hover:bg-quaternary-bg"
                }`}
              >
                Ko-fi
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`w-1/2 cursor-pointer rounded-lg px-3 py-1 transition-colors focus:outline-none sm:mx-0.5 sm:w-auto ${
                  isYearly
                    ? "bg-button-info text-white"
                    : "bg-secondary-bg text-secondary-text hover:bg-quaternary-bg"
                }`}
              >
                Roblox
              </button>
            </div>
          </div>
        </div>

        <div className="-mx-6 mt-16 grid gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4">
          {supporterTiers.map((tier) => (
            <div
              key={tier.name}
              className={`hover:bg-quaternary-bg transform rounded-lg px-6 py-4 transition-all duration-500 ${
                tier.recommended
                  ? "border-button-info bg-secondary-bg border-2"
                  : "border-border-primary bg-secondary-bg border"
              } ${
                highlightedTier === tier.tierNumber
                  ? "ring-warning ring-opacity-75 scale-110 ring-4"
                  : ""
              }`}
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
              </div>

              <h4 className="text-primary-text mt-2 text-3xl font-semibold">
                {tier.name === "Free" ? (
                  <div className="flex items-center gap-2">
                    {isYearly ? (
                      <>
                        <Image
                          src="https://assets.jailbreakchangelogs.xyz/assets/images/Robux_Icon.png"
                          alt="Robux"
                          width={24}
                          height={24}
                          className="h-6 w-6 shrink-0 object-contain"
                        />
                        <span>0R$</span>
                      </>
                    ) : (
                      <span>$0</span>
                    )}
                    <span className="text-secondary-text text-base font-normal">
                      {" "}
                      {isYearly ? "Robux" : "USD"}
                    </span>
                  </div>
                ) : isYearly && tier.priceAlt ? (
                  <div className="flex items-center gap-2">
                    <Image
                      src="https://assets.jailbreakchangelogs.xyz/assets/images/Robux_Icon.png"
                      alt="Robux"
                      width={24}
                      height={24}
                      className="h-6 w-6 shrink-0 object-contain"
                    />
                    <span>{tier.priceAlt.split(" ")[1]}</span>
                    <span className="text-secondary-text text-base font-normal">
                      {" "}
                      Robux
                    </span>
                  </div>
                ) : (
                  <>
                    {tier.price}
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
                <button
                  onClick={() => {
                    const targetElement = document.querySelector(
                      ".support-methods-section",
                    ) as HTMLElement;
                    if (targetElement) {
                      const elementTop = targetElement.offsetTop;
                      window.scrollTo({
                        top: elementTop - 80,
                        behavior: "smooth",
                      });
                    }
                  }}
                  className="bg-button-info hover:bg-button-info-hover focus:bg-button-info-hover mt-10 inline-block w-full transform cursor-pointer rounded-md px-4 py-2 text-center font-medium tracking-wide text-white capitalize transition-colors duration-300 focus:outline-none"
                >
                  {isYearly ? "Support with Robux" : "Support with Ko-fi"}
                </button>
              ) : (
                <div className="border-border-primary bg-primary-bg text-primary-text mt-10 w-full rounded-md border px-4 py-2 text-center font-medium tracking-wide capitalize">
                  Already included
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Important Information Section */}
        <div className="bg-button-info/10 border-border-primary mt-8 rounded-lg border p-6">
          <h3 className="text-primary-text mb-4 text-lg font-semibold">
            Important Information
          </h3>
          <div className="text-secondary-text space-y-2">
            <p>
              <strong>One-time purchases:</strong> All supporter purchases are
              one-time only and non-refundable! Once you redeem your code, you
              keep the perks forever.
            </p>
            <p>
              <strong>Ko-fi Supporters:</strong> If you&apos;re buying a
              supporter tier using{" "}
              <a
                href="https://ko-fi.com/jbchangelogs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-link hover:text-link-hover font-semibold underline transition-colors"
              >
                Ko-fi
              </a>
              ,{" "}
              <span className="font-bold">
                ensure your Discord user ID is in parenthesis inside your
                message
              </span>{" "}
              (e.g.,{" "}
              <code className="bg-surface-bg rounded px-1">
                Hello there! (1019539798383398946)
              </code>
              ).
            </p>
            <p>
              <Link
                href="/redeem"
                className="text-link hover:text-link-hover underline transition-colors"
              >
                After purchase, redeem your code here
              </Link>
              .
            </p>
            <p>
              <strong>Need help?</strong> Didn&apos;t receive a code? Need
              assistance with your donation? Reach out to us at{" "}
              <a
                href="mailto:support@jailbreakchangelogs.xyz"
                className="text-link hover:text-link-hover font-semibold underline transition-colors"
              >
                support@jailbreakchangelogs.xyz
              </a>{" "}
              or join our{" "}
              <a
                href="https://discord.jailbreakchangelogs.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-link hover:text-link-hover underline"
              >
                Discord
              </a>{" "}
              for assistance.
            </p>
          </div>
        </div>

        {/* Support Methods */}
        <div className="support-methods-section mt-12 grid gap-8 md:grid-cols-3">
          <div className="border-border-primary bg-secondary-bg flex flex-col items-center justify-center rounded-lg border p-6 text-center">
            <h3 className="text-primary-text mb-4 text-lg font-semibold">
              Ko-fi Donations
            </h3>
            <div className="flex flex-1 items-center justify-center">
              <ImageModal
                src={kofiImagePath}
                alt="Ko-fi Support QR Code"
                width={240}
                height={240}
                className="mx-auto h-60 w-60"
              />
            </div>
            <a
              href="https://ko-fi.com/jailbreakchangelogs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-link hover:text-link-hover mt-4 inline-block text-sm underline"
            >
              Can&apos;t scan? Click here
            </a>
          </div>

          <div className="border-border-primary bg-secondary-bg flex flex-col items-center justify-center rounded-lg border p-6 text-center">
            <h3 className="text-primary-text mb-4 text-lg font-semibold">
              Roblox Donations
            </h3>
            <div className="flex flex-1 items-center justify-center">
              <ImageModal
                src={robloxImagePath}
                alt="Roblox Support QR Code"
                width={240}
                height={240}
                className="mx-auto h-60 w-60"
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

          <div className="border-border-primary bg-secondary-bg rounded-lg border p-6 text-center">
            <h3 className="text-primary-text mb-4 text-lg font-semibold">
              Crypto Donations
            </h3>
            <div className="space-y-4">
              <div className="border-border-primary bg-surface-bg rounded-lg border p-4">
                <div className="text-primary-text mb-2 flex items-center justify-center gap-2">
                  <Icon
                    icon="logos:bitcoin"
                    className="h-4 w-4"
                    inline={true}
                  />
                  <span className="font-semibold">Bitcoin (BTC)</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-secondary-text flex-1 text-xs break-all">
                    {CRYPTO_ADDRESSES.BTC}
                    <button
                      onClick={() =>
                        copyToClipboard(CRYPTO_ADDRESSES.BTC, "BTC")
                      }
                      className="text-button-info hover:text-button-info-hover ml-1 cursor-pointer transition-colors"
                      title={
                        copiedAddress === "BTC"
                          ? "Copied!"
                          : "Copy Bitcoin address"
                      }
                    >
                      <Icon
                        icon={
                          copiedAddress === "BTC"
                            ? "heroicons:check"
                            : "heroicons:clipboard"
                        }
                        className="h-4 w-4"
                      />
                    </button>
                  </code>
                </div>
              </div>

              <div className="border-border-primary bg-surface-bg rounded-lg border p-4">
                <div className="text-primary-text mb-2 flex items-center justify-center gap-2">
                  <Icon
                    icon="logos:ethereum"
                    className="h-4 w-4"
                    inline={true}
                  />
                  <span className="font-semibold">Ethereum (ETH)</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-secondary-text flex-1 text-xs break-all">
                    {CRYPTO_ADDRESSES.ETH}
                    <button
                      onClick={() =>
                        copyToClipboard(CRYPTO_ADDRESSES.ETH, "ETH")
                      }
                      className="text-button-info hover:text-button-info-hover ml-1 cursor-pointer transition-colors"
                      title={
                        copiedAddress === "ETH"
                          ? "Copied!"
                          : "Copy Ethereum address"
                      }
                    >
                      <Icon
                        icon={
                          copiedAddress === "ETH"
                            ? "heroicons:check"
                            : "heroicons:clipboard"
                        }
                        className="h-4 w-4"
                      />
                    </button>
                  </code>
                </div>
              </div>

              <div className="border-border-primary bg-surface-bg rounded-lg border p-4">
                <div className="text-primary-text mb-2 flex items-center justify-center gap-2">
                  <Icon
                    icon="token-branded:ltc"
                    className="h-4 w-4"
                    inline={true}
                  />
                  <span className="font-semibold">Litecoin (LTC)</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-secondary-text flex-1 text-xs break-all">
                    {CRYPTO_ADDRESSES.LTC}
                    <button
                      onClick={() =>
                        copyToClipboard(CRYPTO_ADDRESSES.LTC, "LTC")
                      }
                      className="text-button-info hover:text-button-info-hover ml-1 cursor-pointer transition-colors"
                      title={
                        copiedAddress === "LTC"
                          ? "Copied!"
                          : "Copy Litecoin address"
                      }
                    >
                      <Icon
                        icon={
                          copiedAddress === "LTC"
                            ? "heroicons:check"
                            : "heroicons:clipboard"
                        }
                        className="h-4 w-4"
                      />
                    </button>
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Long-term Sponsor Section */}
        <div className="border-border-primary bg-secondary-bg mt-4 rounded-lg border p-4">
          <div className="text-center">
            <h3 className="text-primary-text mb-2 text-lg font-semibold">
              Want to become a long-term sponsor?
            </h3>
            <p className="text-secondary-text mb-3 text-sm">
              Reach out via email:{" "}
              <a
                href="mailto:support@jailbreakchangelogs.xyz"
                className="text-link hover:text-link-hover font-semibold underline transition-colors"
              >
                support@jailbreakchangelogs.xyz
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
