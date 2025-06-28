import React from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, TrophyIcon, SparklesIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

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
    color: "border-gray-600"
  },
  {
    name: "Supporter I",
    price: "75R$",
    priceAlt: "or $1 on Ko-fi",
    features: ["Post Comments up to 400 characters", "Custom Regular Avatar"],
    color: "border-[#CD7F32]",
    badgeColor: "from-[#CD7F32] to-[#B87333]"
  },
  {
    name: "Supporter II", 
    price: "200R$",
    priceAlt: "or $3 on Ko-fi",
    features: ["Post Comments up to 800 characters", "Custom Regular Banner"],
    color: "border-[#C0C0C0]",
    badgeColor: "from-[#C0C0C0] to-[#A9A9A9]",
    recommended: true
  },
  {
    name: "Supporter III",
    price: "400R$", 
    priceAlt: "or $5 on Ko-fi",
    features: ["Post Comments up to 2000 characters", "Custom Animated Avatar", "Custom Animated Banner"],
    color: "border-[#FFD700]",
    badgeColor: "from-[#FFD700] to-[#DAA520]"
  }
];

const getFeatureDescription = (feature: string, currentLimit?: string | number, requiredLimit?: string | number) => {
  switch (feature) {
    case 'comment_length':
      const requiredText = `${requiredLimit} characters`;
      
      return {
        title: "Unlock Longer Comments",
        description: `You're trying to post a comment that's longer than your current limit of ${currentLimit} characters. Upgrade to a higher supporter tier to unlock longer comment limits!`,
        current: `Current limit: ${currentLimit} characters`,
        required: `Required: ${requiredText}`
      };
    case 'custom_avatar':
      return {
        title: "Unlock Custom Avatars",
        description: "You're trying to set a custom avatar, but this feature requires a higher supporter tier. Upgrade to unlock custom avatar functionality!",
        current: `Current tier: ${currentLimit}`,
        required: `Required: ${requiredLimit}`
      };
    case 'custom_banner':
      return {
        title: "Unlock Custom Banners",
        description: "You're trying to set a custom banner, but this feature requires a higher supporter tier. Upgrade to unlock custom banner functionality!",
        current: `Current tier: ${currentLimit}`,
        required: `Required: ${requiredLimit}`
      };
    case 'animated_avatar':
      return {
        title: "Unlock Animated Avatars",
        description: "You're trying to set an animated avatar (GIF), but this feature requires the highest supporter tier. Upgrade to unlock animated avatar functionality!",
        current: `Current tier: ${currentLimit}`,
        required: `Required: ${requiredLimit}`
      };
    case 'animated_banner':
      return {
        title: "Unlock Animated Banners",
        description: "You're trying to set an animated banner (GIF), but this feature requires the highest supporter tier. Upgrade to unlock animated banner functionality!",
        current: `Current tier: ${currentLimit}`,
        required: `Required: ${requiredLimit}`
      };
    case 'trade_ad_duration':
      return {
        title: "Unlock Longer Trade Ad Durations",
        description: "You're trying to create a trade ad with a duration above your current tier. Upgrade to unlock longer expiration times!",
        current: `Current tier: ${currentLimit}`,
        required: `Required: ${requiredLimit}`
      };
    default:
      return {
        title: "Supporter Feature",
        description: "This feature requires a higher supporter tier. Upgrade to unlock this and many more features!",
        current: "",
        required: ""
      };
  }
};

export default function SupporterModal({ 
  isOpen, 
  onClose, 
  feature, 
  requiredTier,
  currentLimit,
  requiredLimit 
}: SupporterModalProps) {
  const featureInfo = getFeatureDescription(feature, currentLimit, requiredLimit);

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-[#212A31] rounded-lg shadow-xl border border-[#2E3944] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#2E3944]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-[#5865F2] to-[#4752C4] rounded-lg">
                <SparklesIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <Dialog.Title className="text-xl font-semibold text-white">
                  {featureInfo.title}
                </Dialog.Title>
                <p className="text-sm text-[#748D92]">
                  Upgrade your supporter tier to unlock this feature
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[#748D92] hover:text-white hover:bg-[#2E3944] rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-6">
              <p className="text-[#D3D9D4] mb-4">
                {featureInfo.description}
              </p>
              
              {featureInfo.current && (
                <div className="bg-[#2E3944] rounded-lg p-4 border border-[#37424D]">
                  <span className="text-[#748D92] text-sm">{featureInfo.current}</span>
                </div>
              )}
            </div>

            {/* Supporter Tiers */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Recommended Supporter Tier</h3>
              <div className="grid grid-cols-1 gap-4">
                {(() => {
                  // Recommend the lowest tier that unlocks the feature (requiredTier)
                  const recommendedTier = requiredTier < 4 ? SUPPORTER_TIERS[requiredTier] : null;
                  if (!recommendedTier) return (
                    <div className="text-[#748D92] text-center">You already have the highest supporter tier!</div>
                  );
                  return (
                    <div
                      key={recommendedTier.name}
                      className={`relative rounded-lg border-2 ${recommendedTier.color} bg-[#2E3944] p-4 ${
                        recommendedTier.recommended ? 'ring-2 ring-[#5865F2] ring-opacity-50' : ''
                      }`}
                    >
                      {recommendedTier.recommended && (
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-[#5865F2] text-white text-xs px-3 py-1 rounded-full font-medium">
                          Recommended
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-3">
                        <h4 className="text-lg font-semibold text-white">{recommendedTier.name}</h4>
                        {recommendedTier.badgeColor && (
                          <div className={`inline-flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-r ${recommendedTier.badgeColor}`}>
                            <TrophyIcon className="w-3 h-3 text-black" />
                          </div>
                        )}
                      </div>
                      <div className="mb-3">
                        {(() => {
                          if (feature === 'comment_length') {
                            // Comment length perk
                            const commentPerks = [
                              'Post Comments up to 200 characters',
                              'Post Comments up to 400 characters',
                              'Post Comments up to 800 characters',
                              'Post Comments up to 2000 characters',
                            ];
                            return (
                              <span className="block text-gray-300">{commentPerks[recommendedTier ? SUPPORTER_TIERS.indexOf(recommendedTier) : 0]}</span>
                            );
                          } else if (feature === 'trade_ad_duration') {
                            // Trade ad duration perk
                            const tradeAdPerks = [
                              'Trade Ad Duration: 6 Hours',
                              'Trade Ad Duration: +6 Hours (12 Hours total)',
                              'Trade Ad Duration: +12 Hours (24 Hours total)',
                              'Trade Ad Duration: +24 Hours (48 Hours total)',
                            ];
                            return (
                              <span className="block text-gray-300">{tradeAdPerks[recommendedTier ? SUPPORTER_TIERS.indexOf(recommendedTier) : 0]}</span>
                            );
                          } else if (feature === 'custom_avatar') {
                            return <span className="block text-gray-300">Custom Regular Avatar</span>;
                          } else if (feature === 'custom_banner') {
                            return <span className="block text-gray-300">Custom Regular Banner</span>;
                          } else if (feature === 'animated_avatar') {
                            return <span className="block text-gray-300">Custom Animated Avatar</span>;
                          } else if (feature === 'animated_banner') {
                            return <span className="block text-gray-300">Custom Animated Banner</span>;
                          } else {
                            // fallback: show the first feature
                            return recommendedTier && recommendedTier.features[0] ? (
                              <span className="block text-gray-300">{recommendedTier.features[0]}</span>
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
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/supporting"
                className="flex-1 bg-gradient-to-r from-[#5865F2] to-[#4752C4] text-white py-3 px-6 rounded-lg font-medium text-center hover:from-[#4752C4] hover:to-[#3C45A5] transition-all duration-200"
              >
                View All Supporter Benefits
              </Link>
              <button
                onClick={onClose}
                className="px-6 py-3 border border-[#37424D] text-[#D3D9D4] rounded-lg hover:bg-[#2E3944] hover:text-white transition-colors"
              >
                Maybe Later
              </button>
            </div>

            {/* Footer Note */}
            <div className="mt-4 p-3 bg-[#2E3944] rounded-lg border border-[#37424D]">
              <p className="text-xs text-[#748D92] text-center">
                💡 <strong>Pro tip:</strong> All supporter purchases are one-time only! Once you purchase, you keep the perks forever.
              </p>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 