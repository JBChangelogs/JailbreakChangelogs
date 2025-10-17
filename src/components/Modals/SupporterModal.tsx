import React from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import {
  XMarkIcon,
  TrophyIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { Icon } from "../UI/IconWrapper";
import Link from "next/link";
import { getAllowedFileExtensions } from "@/config/settings";

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
  },
  {
    name: "Supporter I",
    price: "75R$",
    priceAlt: "or $1 on Ko-fi",
    features: ["Post Comments up to 400 characters"],
    color: "border-[#CD7F32]",
    badgeColor: "from-[#CD7F32] to-[#B87333]",
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
    badgeColor: "from-[#C0C0C0] to-[#A9A9A9]",
    recommended: true,
  },
  {
    name: "Supporter III",
    price: "400R$",
    priceAlt: "or $5 on Ko-fi",
    features: [
      "Post Comments up to 2,000 characters",
      "Square Avatar Border",
      "On-Demand Inventory Refresh",
    ],
    color: "border-[#FFD700]",
    badgeColor: "from-[#FFD700] to-[#DAA520]",
  },
];

const getFeatureDescription = (
  feature: string,
  currentLimit?: string | number,
  requiredLimit?: string | number,
) => {
  switch (feature) {
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
    case "inventory_refresh":
      return {
        title: "Unlock On-Demand Inventory Refresh",
        description:
          "You're trying to refresh inventory data on-demand, but this feature requires Supporter III. Upgrade to unlock instant inventory refreshes anytime!",
        current: `Current tier: ${currentLimit}`,
        required: `Required: ${requiredLimit}`,
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
  const featureInfo = getFeatureDescription(
    feature,
    currentLimit,
    requiredLimit,
  );

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div
        className="bg-overlay-bg fixed inset-0 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="modal-container bg-secondary-bg border-button-info mx-auto w-full max-w-2xl overflow-hidden rounded-lg border shadow-lg">
          {/* Header */}
          <div className="modal-header border-border-primary flex items-center justify-between border-b p-6">
            <div className="flex items-center gap-3">
              <div className="bg-button-info rounded-lg p-2">
                <SparklesIcon className="text-form-button-text h-6 w-6" />
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
            <button
              onClick={onClose}
              className="text-secondary-text cursor-pointer rounded-lg p-2 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="modal-content p-6">
            <div className="mb-6">
              <p className="text-primary-text mb-4">
                {featureInfo.description}
              </p>

              {featureInfo.current && (
                <div className="border-border-primary bg-tertiary-bg rounded-lg border p-4">
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
                          ? "ring-opacity-50 ring-button-info ring-2"
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
                        {recommendedTier.badgeColor && (
                          <div
                            className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r ${recommendedTier.badgeColor}`}
                          >
                            <TrophyIcon className="h-3 w-3 text-black" />
                          </div>
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
                          } else if (feature === "inventory_refresh") {
                            return (
                              <span className="text-secondary-text block">
                                On-Demand Inventory Refresh
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
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/supporting"
                className="bg-button-info text-form-button-text hover:bg-button-info-hover flex-1 rounded-lg px-6 py-3 text-center font-medium transition-all duration-200"
              >
                View All Supporter Benefits
              </Link>
              <button
                onClick={onClose}
                className="text-secondary-text hover:text-primary-text border-border-primary bg-tertiary-bg hover:bg-primary-bg cursor-pointer rounded-lg border px-6 py-3 transition-colors"
              >
                Maybe Later
              </button>
            </div>

            {/* Footer Note */}
            <div className="border-border-primary bg-tertiary-bg mt-4 rounded-lg border p-3">
              <p className="flex items-center justify-center gap-1 text-center text-xs">
                <Icon
                  icon="emojione:light-bulb"
                  className="text-sm text-yellow-500"
                />
                <strong className="text-primary-text">Pro tip:</strong>{" "}
                <span className="text-secondary-text">
                  All supporter purchases are one-time only and non-refundable!
                  Once you redeem your code, you keep the perks forever.
                </span>
              </p>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
