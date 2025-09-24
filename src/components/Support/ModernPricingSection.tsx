"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { TrophyIcon } from "@heroicons/react/24/solid";
import { RobloxIcon } from "@/components/Icons/RobloxIcon";
import { getAllowedFileExtensions } from "@/config/settings";

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
      "Hide all advertisements",
      "Post Comments up to 400 characters",
      "Trade Ad Duration: +6 Hours (12 Hours total)",
      "Custom Supporter Badge",
      "Discord Role: Supporter",
      "Comments highlighted with Bronze border and badge",
      "Get your trade ads featured in our Discord for maximum reach (highlighted to stand out)",
    ],
    tierNumber: 1,
  },
  {
    name: "Supporter II",
    price: "$3",
    priceAlt: "or 200R$ on Roblox",
    features: [
      "**All Supporter I benefits**",
      "Post Comments up to 800 characters",
      "Trade Ad Duration: +12 Hours (24 Hours total)",
      `Upload and Use Custom Banners (${getAllowedFileExtensions()})`,
      `Upload and Use Custom Avatars (${getAllowedFileExtensions()})`,
      "On-Demand Inventory Refresh (Coming Soon)",
      "Use inventory commands outside our Discord server",
      "Comments highlighted with Silver border and badge",
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
      "On-Demand Inventory Refresh (Coming Soon)",
    ],
    tierNumber: 3,
  },
];

export default function ModernPricingSection() {
  const [isYearly, setIsYearly] = useState(false);
  const [highlightedTier, setHighlightedTier] = useState<number | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

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
            <p className="text-secondary-text mt-4">
              One-time purchases. No recurring fees. Keep perks forever.
            </p>
          </div>

          <div className="border-border-primary mt-6 overflow-hidden rounded-lg border p-0.5">
            <div className="flex sm:-mx-0.5">
              <button
                onClick={() => setIsYearly(false)}
                className={`w-1/2 cursor-pointer rounded-lg px-3 py-1 transition-colors focus:outline-none sm:mx-0.5 sm:w-auto ${
                  !isYearly
                    ? "bg-button-info text-white"
                    : "text-secondary-text bg-secondary-bg hover:bg-quaternary-bg"
                }`}
              >
                Ko-fi
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`w-1/2 cursor-pointer rounded-lg px-3 py-1 transition-colors focus:outline-none sm:mx-0.5 sm:w-auto ${
                  isYearly
                    ? "bg-button-info text-white"
                    : "text-secondary-text bg-secondary-bg hover:bg-quaternary-bg"
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
                  ? "bg-secondary-bg border-button-info border-2"
                  : "bg-secondary-bg border-border-primary border"
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
                {tier.name !== "Free" && (
                  <div
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${
                      tier.name === "Supporter I"
                        ? "bg-gradient-to-r from-[#CD7F32] to-[#B87333]" // Bronze
                        : tier.name === "Supporter II"
                          ? "bg-gradient-to-r from-[#C0C0C0] to-[#A9A9A9]" // Silver
                          : "bg-gradient-to-r from-[#FFD700] to-[#DAA520]" // Gold
                    }`}
                  >
                    <TrophyIcon className="h-4 w-4 text-black" />
                  </div>
                )}
              </div>

              <h4 className="text-primary-text mt-2 text-3xl font-semibold">
                {tier.name === "Free" ? (
                  <>
                    {isYearly ? "0R$" : "$0"}
                    <span className="text-secondary-text text-base font-normal">
                      {" "}
                      {isYearly ? "Robux" : "USD"}
                    </span>
                  </>
                ) : isYearly && tier.priceAlt ? (
                  <>
                    {tier.priceAlt.split(" ")[1]}
                    <span className="text-secondary-text text-base font-normal">
                      {" "}
                      Robux
                    </span>
                  </>
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
                      className="text-button-info h-5 w-5 flex-shrink-0"
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
                <a
                  href={
                    isYearly
                      ? "https://www.roblox.com/games/104188650191561/Support-Us"
                      : "https://ko-fi.com/jailbreakchangelogs"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-button-info hover:bg-button-info-hover focus:bg-button-info-hover mt-10 inline-block w-full transform rounded-md px-4 py-2 text-center font-medium tracking-wide text-white capitalize transition-colors duration-300 focus:outline-none"
                >
                  {isYearly ? "Support with Robux" : "Support with Ko-fi"}
                </a>
              ) : (
                <div className="text-primary-text bg-primary-bg border-border-primary mt-10 w-full rounded-md border px-4 py-2 text-center font-medium tracking-wide capitalize">
                  Already included
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Important Information Section */}
        <div className="bg-button-info/10 border-border-primary mt-16 rounded-lg border p-6">
          <h3 className="text-primary-text mb-4 text-lg font-semibold">
            Important Information
          </h3>
          <div className="text-secondary-text space-y-2">
            <p>
              <strong>One-time purchases:</strong> All supporter purchases are
              one-time only and non-refundable! Once you purchase, you keep the
              perks forever.
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
          </div>
        </div>

        {/* Support Methods */}
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <div className="bg-secondary-bg border-border-primary rounded-lg border p-6 text-center">
            <h3 className="text-primary-text mb-4 text-lg font-semibold">
              Ko-fi Donations
            </h3>
            <Image
              src="https://assets.jailbreakchangelogs.xyz/assets/images/kofi_assets/kofi_symbol.svg"
              alt="Ko-fi Symbol"
              width={40}
              height={40}
              className="mx-auto mb-4"
            />
            <Image
              src="https://assets.jailbreakchangelogs.xyz/assets/images/support/KoFi_Supporter_QR_Code.webp"
              alt="Ko-fi Support QR Code"
              width={192}
              height={192}
              className="mx-auto rounded-lg shadow"
            />
            <a
              href="https://ko-fi.com/jailbreakchangelogs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-link hover:text-link-hover mt-4 inline-block text-sm underline"
            >
              Can&apos;t scan? Click here
            </a>
          </div>

          <div className="bg-secondary-bg border-border-primary rounded-lg border p-6 text-center">
            <h3 className="text-primary-text mb-4 text-lg font-semibold">
              Roblox Donations
            </h3>
            <RobloxIcon className="mx-auto mb-4 h-10 w-10" />
            <Image
              src="https://assets.jailbreakchangelogs.xyz/assets/images/support/Roblox_Supporter_QR_Code.webp"
              alt="Roblox Support QR Code"
              width={192}
              height={192}
              className="mx-auto rounded-lg shadow"
            />
            <a
              href="https://www.roblox.com/games/104188650191561/Support-Us"
              target="_blank"
              rel="noopener noreferrer"
              className="text-link hover:text-link-hover mt-4 inline-block text-sm underline"
            >
              Can&apos;t scan? Click here
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
