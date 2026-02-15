import React from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { Icon } from "@/components/ui/IconWrapper";
import Link from "next/link";
import Image from "next/image";
import { getAllowedFileExtensions } from "@/config/settings";
import {
  HIDE_ADS_REQUIRED_TIER,
  SUPPORTER_TIER_NAMES,
} from "@/config/supporter";
import { Button } from "@/components/ui/button";

interface SupporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  currentTier: number;
  requiredTier: number;
  currentLimit?: string | number;
  requiredLimit?: string | number;
}

const SUPPORTER_TIERS = [
  {
    name: "Free",
    price: "$0",
    features: ["Post Comments up to 200 characters"],
    color: "border-gray-600",
    tierNumber: 0,
  },
  {
    name: "Supporter I",
    price: "75R$",
    priceAlt: "or $1 on Ko-fi",
    features: ["Post Comments up to 400 characters"],
    color: "border-[#CD7F32]",
    tierNumber: 1,
  },
  {
    name: "Supporter II",
    price: "200R$",
    priceAlt: "or $3 on Ko-fi",
    features: [
      "Post Comments up to 800 characters",
      `Upload and Use Custom Avatars (${getAllowedFileExtensions()})`,
      `Upload and Use Custom Banners (${getAllowedFileExtensions()})`,
    ],
    color: "border-[#C0C0C0]",
    recommended: true,
    tierNumber: 2,
  },
  {
    name: "Supporter III",
    price: "400R$",
    priceAlt: "or $5 on Ko-fi",
    features: [
      "Post Comments up to 2,000 characters",
      "Square Avatar Border",
      "On-Demand Inventory Scan",
    ],
    color: "border-[#FFD700]",
    tierNumber: 3,
  },
];

const getFeatureDescription = (
  feature: string,
  currentLimit?: string | number,
  requiredLimit?: string | number,
) => {
  switch (feature) {
    case "hide_ads":
      return {
        title: "Hide Ads",
        description:
          "You're trying to hide ads. Hiding ads is a supporter perk. Upgrade to Supporter II or higher to remove advertisements and support the site.",
        current: `Current tier: ${currentLimit ?? "Free"}`,
        required: `Required: ${
          requiredLimit ?? SUPPORTER_TIER_NAMES[HIDE_ADS_REQUIRED_TIER]
        }`,
      };
    case "comment_length":
      const requiredText = `${requiredLimit} characters`;

      return {
        title: "Unlock Longer Comments",
        description: `You're trying to post a comment that's longer than your current limit of ${currentLimit} characters. Upgrade to a higher supporter tier to unlock longer comment limits!`,
        current: `Current limit: ${currentLimit} characters`,
        required: `Required: ${requiredText}`,
      };
    case "custom_avatar":
      return {
        title: "Unlock Custom Avatars",
        description:
          "You're trying to upload and use a custom avatar, but this feature requires Supporter II or higher. Upgrade to unlock custom avatar functionality!",
        current: `Current tier: ${currentLimit}`,
        required: `Required: ${requiredLimit}`,
      };
    case "custom_banner":
      return {
        title: "Unlock Custom Banners",
        description:
          "You're trying to upload and use a custom banner, but this feature requires Supporter II or higher. Upgrade to unlock custom banner functionality!",
        current: `Current tier: ${currentLimit}`,
        required: `Required: ${requiredLimit}`,
      };
    case "trade_ad_duration":
      return {
        title: "Unlock Longer Trade Ad Durations",
        description:
          "You're trying to create a trade ad with a duration above your current tier. Upgrade to unlock longer expiration times!",
        current: `Current tier: ${currentLimit}`,
        required: `Required: ${requiredLimit}`,
      };
    case "inventory_scan":
      return {
        title: "Unlock On-Demand Inventory Scan",
        description:
          "You're trying to scan your inventory on-demand, but this feature requires Supporter III. Upgrade to unlock instant inventory scans anytime!",
        current: `Current tier: ${currentLimit}`,
        required: `Required: ${requiredLimit}`,
      };
    case "og_notification":
      return {
        title: "Unlock More OG Notifications",
        description: `You've reached your limit of ${currentLimit} tracked items. Upgrade your supporter tier to track more OG items!`,
        current: `Current limit: ${currentLimit} items`,
        required: `Next tier limit: ${requiredLimit} items`,
      };
    default:
      return {
        title: "Supporter Feature",
        description:
          "This feature requires a higher supporter tier. Upgrade to unlock this and many more features!",
        current: "",
        required: "",
      };
  }
};

export default function SupporterModal({
  isOpen,
  onClose,
  feature,
  requiredTier,
  currentLimit,
  requiredLimit,
}: SupporterModalProps) {
  const BADGE_BASE_URL =
    "https://assets.jailbreakchangelogs.xyz/assets/website_icons";
  const featureInfo = getFeatureDescription(
    feature,
    currentLimit,
    requiredLimit,
  );

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-[3000]">
      <div
        className="bg-overlay-bg fixed inset-0 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="modal-container border-button-info bg-secondary-bg mx-auto flex max-h-[60vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border shadow-lg sm:max-h-[75vh]">
          {/* Header */}
          <div className="modal-header border-border-card flex items-center justify-between border-b p-6">
            <div className="flex items-center gap-3">
              <div className="bg-button-info rounded-lg p-2">
                <Icon
                  icon="heroicons-outline:sparkles"
                  className="text-form-button-text h-6 w-6"
                />
              </div>
              <div>
                <DialogTitle className="text-primary-text text-xl font-semibold">
                  {featureInfo.title}
                </DialogTitle>
                <p className="text-secondary-text text-sm">
                  Upgrade your supporter tier to unlock this feature
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-secondary-text h-9 w-9 p-0"
            >
              <Icon icon="heroicons:x-mark" className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div
            className="modal-content scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border-primary hover:scrollbar-thumb-border-focus overflow-y-auto p-6"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "var(--color-border-primary) transparent",
            }}
          >
            <div className="mb-6">
              <p className="text-primary-text mb-4">
                {featureInfo.description}
              </p>

              {featureInfo.current && (
                <div className="border-border-card bg-tertiary-bg rounded-lg border p-4">
                  <span className="text-primary-text text-sm font-medium">
                    {featureInfo.current}
                  </span>
                </div>
              )}
            </div>

            {/* Supporter Tiers */}
            <div className="mb-6">
              <h3 className="text-primary-text mb-4 text-lg font-semibold">
                Recommended Supporter Tier
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {(() => {
                  // Recommend the lowest tier that unlocks the feature (requiredTier)
                  const recommendedTier =
                    requiredTier < 4 ? SUPPORTER_TIERS[requiredTier] : null;
                  if (!recommendedTier)
                    return (
                      <div className="text-secondary-text text-center">
                        You already have the highest supporter tier!
                      </div>
                    );
                  return (
                    <div
                      key={recommendedTier.name}
                      className={`relative rounded-lg border-2 ${recommendedTier.color} bg-tertiary-bg p-4 ${
                        recommendedTier.recommended
                          ? "ring-button-info ring-opacity-50 ring-2"
                          : ""
                      }`}
                    >
                      {recommendedTier.recommended && (
                        <div className="bg-button-info text-form-button-text absolute -top-2 left-1/2 -translate-x-1/2 transform rounded-full px-3 py-1 text-xs font-medium">
                          Recommended
                        </div>
                      )}
                      <div className="mb-3 flex items-center gap-2">
                        <h4 className="text-primary-text text-lg font-semibold">
                          {recommendedTier.name}
                        </h4>
                        {recommendedTier.name !== "Free" &&
                          recommendedTier.tierNumber && (
                            <Image
                              src={`${BADGE_BASE_URL}/jbcl_supporter_${recommendedTier.tierNumber}.svg`}
                              alt={recommendedTier.name}
                              width={24}
                              height={24}
                              className="object-contain"
                            />
                          )}
                      </div>
                      <div className="mb-3">
                        {(() => {
                          if (feature === "comment_length") {
                            // Comment length perk
                            const commentPerks = [
                              "Post Comments up to 200 characters",
                              "Post Comments up to 400 characters",
                              "Post Comments up to 800 characters",
                              "Post Comments up to 2000 characters",
                            ];
                            return (
                              <span className="text-secondary-text block">
                                {
                                  commentPerks[
                                    recommendedTier
                                      ? SUPPORTER_TIERS.indexOf(recommendedTier)
                                      : 0
                                  ]
                                }
                              </span>
                            );
                          } else if (feature === "trade_ad_duration") {
                            // Trade ad duration perk
                            const tradeAdPerks = [
                              "Trade Ad Duration: 6 Hours",
                              "Trade Ad Duration: +6 Hours (12 Hours total)",
                              "Trade Ad Duration: +12 Hours (24 Hours total)",
                              "Trade Ad Duration: +24 Hours (48 Hours total)",
                            ];
                            return (
                              <span className="text-secondary-text block">
                                {
                                  tradeAdPerks[
                                    recommendedTier
                                      ? SUPPORTER_TIERS.indexOf(recommendedTier)
                                      : 0
                                  ]
                                }
                              </span>
                            );
                          } else if (feature === "custom_avatar") {
                            return (
                              <span className="text-secondary-text block">
                                Upload and Use Custom Avatars (
                                {getAllowedFileExtensions()})
                              </span>
                            );
                          } else if (feature === "custom_banner") {
                            return (
                              <span className="text-secondary-text block">
                                Upload and Use Custom Banners (
                                {getAllowedFileExtensions()})
                              </span>
                            );
                          } else if (feature === "hide_ads") {
                            return (
                              <span className="text-secondary-text block">
                                Hide ads across the site
                              </span>
                            );
                          } else if (feature === "inventory_scan") {
                            return (
                              <span className="text-secondary-text block">
                                On-Demand Inventory Scan
                              </span>
                            );
                          } else if (feature === "og_notification") {
                            const ogPerks = [
                              "Monitor up to 3 OG Items",
                              "Monitor up to 5 OG Items",
                              "Monitor up to 10 OG Items",
                              "Monitor up to 15 OG Items",
                            ];
                            return (
                              <span className="text-secondary-text block">
                                {
                                  ogPerks[
                                    recommendedTier
                                      ? SUPPORTER_TIERS.indexOf(recommendedTier)
                                      : 0
                                  ]
                                }
                              </span>
                            );
                          } else {
                            // fallback: show the first feature
                            return recommendedTier &&
                              recommendedTier.features[0] ? (
                              <span className="text-secondary-text block">
                                {recommendedTier.features[0]}
                              </span>
                            ) : null;
                          }
                        })()}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="flex-1">
                <Link href="/supporting">View All Supporter Benefits</Link>
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={onClose}
                className="border-border-card bg-tertiary-bg text-secondary-text hover:bg-primary-bg hover:text-primary-text border"
              >
                Maybe Later
              </Button>
            </div>

            {/* Footer Note */}
            <div className="border-border-card bg-tertiary-bg mt-4 rounded-lg border p-3">
              <p className="text-secondary-text text-center text-xs">
                All supporter purchases are one-time only and non-refundable!
                Once you redeem your code, you keep the perks forever.
              </p>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
