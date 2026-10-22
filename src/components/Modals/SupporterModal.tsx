import React from "react";
import Link from "next/link";
import Image from "next/image";
import { getAllowedFileExtensions } from "@/config/settings";
import {
  HIDE_ADS_REQUIRED_TIER,
  SUPPORTER_TIER_NAMES,
} from "@/config/supporter";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";

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
    features: [
      "Post Comments up to 400 characters",
      "Custom Profile Accent Color",
    ],
    color: "border-[#CD7F32]",
    tierNumber: 1,
  },
  {
    name: "Supporter II",
    price: "200R$",
    features: [
      "Post Comments up to 800 characters",
      `Upload and Use Custom Avatars (${getAllowedFileExtensions()})`,
      `Upload and Use Custom Banners (${getAllowedFileExtensions()})`,
      `Upload a Custom Profile Background (${getAllowedFileExtensions()})`,
    ],
    color: "border-[#C0C0C0]",
    tierNumber: 2,
  },
  {
    name: "Supporter III",
    price: "400R$",
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
        description: "Remove ads and support the site with Supporter II.",
        current: `Current tier: ${currentLimit ?? "Free"}`,
        required: `Required: ${
          requiredLimit ?? SUPPORTER_TIER_NAMES[HIDE_ADS_REQUIRED_TIER]
        }`,
      };
    case "comment_length":
      return {
        title: "Unlock Longer Comments",
        description: `Your comment exceeds ${currentLimit} characters. Upgrade to increase your limit to ${requiredLimit}.`,
        current: `Current limit: ${currentLimit} characters`,
        required: `Required: ${requiredLimit} characters`,
      };
    case "custom_avatar":
      return {
        title: "Unlock Custom Avatars",
        description: "Use a custom avatar with Supporter II or higher.",
        current: `Current tier: ${currentLimit}`,
        required: `Required: ${requiredLimit}`,
      };
    case "custom_banner":
      return {
        title: "Unlock Custom Banners",
        description:
          "Personalize your profile with a custom banner with Supporter II or higher.",
        current: `Current tier: ${currentLimit}`,
        required: `Required: ${requiredLimit}`,
      };
    case "accent_color":
      return {
        title: "Unlock Custom Accent Colors",
        description:
          "Choose your profile’s accent color with Supporter I or higher.",
        current: `Current tier: ${currentLimit}`,
        required: `Required: ${requiredLimit}`,
      };
    case "custom_background":
      return {
        title: "Unlock Custom Backgrounds",
        description:
          "Use a custom profile background with Supporter II or higher.",
        current: `Current tier: ${currentLimit}`,
        required: `Required: ${requiredLimit}`,
      };
    case "trade_ad_duration":
      return {
        title: "Unlock Longer Trade Ad Durations",
        description: `Keep your trade ads active longer with ${requiredLimit}.`,
        current: `Current tier: ${currentLimit}`,
        required: `Required: ${requiredLimit}`,
      };
    case "inventory_scan":
      return {
        title: "Unlock On-Demand Inventory Scan",
        description: "Scan your inventory on demand with Supporter III.",
        current: `Current tier: ${currentLimit}`,
        required: `Required: ${requiredLimit}`,
      };
    case "og_notification":
      return {
        title: "Unlock More OG Notifications",
        description: `You’re tracking the maximum of ${currentLimit} OG items. Upgrade to track up to ${requiredLimit}.`,
        current: `Current limit: ${currentLimit} items`,
        required: `Next tier limit: ${requiredLimit} items`,
      };
    default:
      return {
        title: "Supporter Feature",
        description: "Upgrade your supporter tier to unlock this feature.",
        current: "",
        required: "",
      };
  }
};

export default function SupporterModal({
  isOpen,
  onClose,
  feature,
  currentTier,
  requiredTier,
  currentLimit,
  requiredLimit,
}: SupporterModalProps) {
  const BADGE_BASE_URL =
    "https://assets.jailbreakchangelogs.com/assets/website_icons";
  const featureInfo = getFeatureDescription(
    feature,
    currentLimit,
    requiredLimit,
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="bg-secondary-bg max-w-2xl rounded-lg p-0 backdrop-blur-none"
        showClose
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <div>
            <DialogTitle className="text-primary-text text-xl font-semibold">
              {featureInfo.title}
            </DialogTitle>
            <DialogDescription className="text-secondary-text mt-1 text-sm">
              {featureInfo.description}
              <span className="text-link mt-1 block text-xs">
                One-time purchase • Non-refundable • Keep perks forever
              </span>
            </DialogDescription>
          </div>
        </DialogHeader>

        <div
          className="max-h-[60vh] overflow-y-auto px-6 pt-4 pb-4 sm:max-h-[75vh]"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "var(--color-border-primary) transparent",
          }}
        >
          {featureInfo.current && (
            <p className="text-secondary-text mb-6 flex items-center gap-2 text-sm">
              {featureInfo.current}
              {currentTier >= 1 && currentTier <= 3 && (
                <Image
                  src={`${BADGE_BASE_URL}/jbcl_supporter_${currentTier}.svg`}
                  alt=""
                  width={20}
                  height={20}
                  className="shrink-0 object-contain"
                />
              )}
            </p>
          )}

          {/* Supporter Tiers */}
          <div>
            <h3 className="text-primary-text mb-4 text-lg font-semibold">
              Suggested upgrade
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {(() => {
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
                    className={`bg-tertiary-bg min-w-0 rounded-lg border-2 px-4 py-3 ${recommendedTier.color}`}
                  >
                    <div className="mb-2 flex items-center gap-2">
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
                    <div>
                      {(() => {
                        if (feature === "comment_length") {
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
                                  SUPPORTER_TIERS.indexOf(recommendedTier)
                                ]
                              }
                            </span>
                          );
                        } else if (feature === "trade_ad_duration") {
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
                                  SUPPORTER_TIERS.indexOf(recommendedTier)
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
                        } else if (feature === "accent_color") {
                          return (
                            <span className="text-secondary-text block">
                              Choose a Custom Profile Accent Color
                            </span>
                          );
                        } else if (feature === "custom_background") {
                          return (
                            <span className="text-secondary-text block">
                              Upload a Custom Profile Background (
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
                                  SUPPORTER_TIERS.indexOf(recommendedTier)
                                ]
                              }
                            </span>
                          );
                        } else {
                          return recommendedTier.features[0] ? (
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
        </div>

        {/* Action Buttons */}
        <DialogFooter className="gap-2 px-6 pt-2 pb-6">
          <DialogClose asChild>
            <Button variant="ghost" size="sm">
              Maybe Later
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button asChild size="sm">
              <Link href="/supporting">View supporter plans</Link>
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
