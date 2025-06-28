import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { TrophyIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';

interface SupporterTier {
  name: string;
  price: string;
  priceAlt?: string;
  features: string[];
  recommended?: boolean;
  xFeatures?: string[];
}

const supporterTiers: SupporterTier[] = [
  {
    name: "Free",
    price: "$0",
    features: [
      "Post Comments up to 200 characters",
      "Trade Ad Duration: 6 Hours",
      "Custom Animated Avatar",
      "Custom Animated Banner",
      "Custom Regular Avatar",
      "Custom Regular Banner",
    ]
  },
  {
    name: "Supporter I",
    price: "75R$",
    priceAlt: "or $1 on Ko-fi",
    features: [
      "Post Comments up to 400 characters",
      "Trade Ad Duration: +6 Hours (12 Hours total)",
      "Custom Animated Avatar",
      "Custom Animated Banner",
      "Custom Regular Banner",
      "Custom Regular Avatar",
      "Custom Supporter Badge",
      "Discord Role: Supporter",
      "Comments highlighted with Bronze border and badge",
      "All Free tier benefits"
    ],
    xFeatures: [
      "Custom Animated Avatar",
      "Custom Animated Banner",
      "Custom Regular Banner",
      "Custom Regular Avatar"
    ]
  },
  {
    name: "Supporter II",
    price: "200R$",
    priceAlt: "or $3 on Ko-fi",
    features: [
      "Post Comments up to 800 characters",
      "Trade Ad Duration: +12 Hours (24 Hours total)",
      "Custom Animated Avatar",
      "Custom Animated Banner",
      "Custom Regular Banner",
      "Custom Regular Avatar",
      "Custom Supporter Badge",
      "Discord Role: Supporter",
      "Comments highlighted with Silver border and badge",
      "All Supporter I benefits"
    ],
    xFeatures: [
      "Custom Animated Avatar",
      "Custom Animated Banner"
    ],
    recommended: true
  },
  {
    name: "Supporter III",
    price: "400R$",
    priceAlt: "or $5 on Ko-fi",
    features: [
      "Post Comments up to 2,000 characters",
      "Trade Ad Duration: +24 Hours (48 Hours total)",
      "Custom Regular/Animated Avatar",
      "Custom Regular/Animated Banner",
      "Custom Supporter Badge",
      "Discord Role: Supporter",
      "Comments highlighted with Gold border and badge",
      "Square Avatar Display",
      "All Supporter II benefits"
    ]
  }
];

export default function SupportingPage() {
  return (
    <div className="container mx-auto px-4 py-8 mb-8 max-w-[1920px]">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 text-white">Support Jailbreak Changelogs</h1>
        
        <div className="flex flex-col md:flex-row gap-6 justify-center items-stretch max-w-4xl mx-auto mb-8">
          <div className="flex-1 bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <svg className="h-5 w-5 text-blue-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p className="text-lg font-semibold text-blue-300">Important Information</p>
            </div>
            <p className="text-gray-300 mb-3">
              All supporter purchases are one-time only! Once you purchase, you keep the perks forever.
            </p>
            <Link 
              href="/redeem" 
              className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors"
            >
              <span>After purchase, redeem your code here</span>
              <svg className="h-4 w-4 ml-1" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M9 5l7 7-7 7"></path>
              </svg>
            </Link>
          </div>

          <div className="flex-1 bg-[#212a31] border border-gray-700/50 rounded-lg p-4 flex flex-col justify-center">
            <p className="text-gray-300">
              By supporting Jailbreak Changelogs, you&apos;re helping us maintain and improve this open-source project, community made for Roblox Jailbreak. Your support enables us to continue providing accurate, timely updates and new features to help the community stay informed about their favorite game.
            </p>
            <span className="text-right text-sm text-gray-400 italic mt-4">— Jakobiis and Jalenzz</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 flex-grow">
          {supporterTiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-lg shadow-lg overflow-hidden ${
                tier.recommended
                  ? 'border-2 border-blue-500 transform scale-105'
                  : 'border border-gray-700'
              } bg-[#212a31]`}
            >
              {tier.recommended && (
                <div className="bg-[#1d7da3] text-white text-center py-2 font-semibold">
                  Recommended
                </div>
              )}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-2xl font-bold text-white">{tier.name}</h2>
                  {tier.name !== "Free" && (
                    <div className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
                      tier.name === "Supporter I"
                        ? 'bg-gradient-to-r from-[#CD7F32] to-[#B87333]' // Bronze
                        : tier.name === "Supporter II"
                          ? 'bg-gradient-to-r from-[#C0C0C0] to-[#A9A9A9]' // Silver
                          : 'bg-gradient-to-r from-[#FFD700] to-[#DAA520]' // Gold
                    }`}>
                      <TrophyIcon className="w-4 h-4 text-black" />
                    </div>
                  )}
                </div>
                <div className="mb-4">
                  {tier.price === "$0" ? (
                    <span className="text-3xl font-bold text-white">{tier.price}</span>
                  ) : (
                    <div className="flex items-center">
                      <span className="text-3xl font-bold text-white">{tier.price.replace('R$', '')}</span>
                      <Image
                        src="/assets/images/Robux_Icon.png"
                        alt="Robux"
                        width={24}
                        height={24}
                        className="ml-1"
                        unoptimized
                      />
                    </div>
                  )}
                  {tier.priceAlt && (
                    <p className="text-sm text-gray-400">{tier.priceAlt}</p>
                  )}
                </div>
                <ul className="space-y-3">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      {tier.xFeatures?.includes(feature) ? (
                        <XMarkIcon
                          className="h-5 w-5 text-red-500 mr-2 mt-1"
                        />
                      ) : (
                        <CheckIcon
                          className="h-5 w-5 text-green-500 mr-2 mt-1"
                        />
                      )}
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:w-80 flex-shrink-0">
          <div className="sticky top-8 bg-[#212a31] rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-6 text-center text-white">Scan to Support</h2>
            <div className="space-y-8">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-3 text-white">Roblox Support</h3>
                <Image 
                  src="https://assets.jailbreakchangelogs.xyz/assets/images/support/Roblox_Supporter_QR_Code.webp"
                  alt="Roblox Support QR Code"
                  width={192}
                  height={192}
                  className="mx-auto rounded-lg shadow"
                  unoptimized
                />
                <a 
                  href="https://www.roblox.com/games/104188650191561/Support-Us"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block"
                >
                  Can&apos;t scan? Click here
                </a>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-3 text-white">Ko-fi Support</h3>
                <Image 
                  src="https://assets.jailbreakchangelogs.xyz/assets/images/support/KoFi_Supporter_QR_Code.webp"
                  alt="Ko-fi Support QR Code"
                  width={192}
                  height={192}
                  className="mx-auto rounded-lg shadow"
                  unoptimized
                />
                <a 
                  href="https://ko-fi.com/jailbreakchangelogs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block"
                >
                  Can&apos;t scan? Click here
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 