"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";
import UserAvatar from "@/components/Users/UserAvatarClient";
import { Supporter } from "@/utils/api";
import SupporterCarousel from "./SupporterCarousel";

interface SupportersSectionProps {
  supporters: Supporter[];
}

const MAX_SUPPORTERS_PER_TIER = 15;
const EXCLUDED_IDS = [
  "1019539798383398946",
  "659865209741246514",
  "1327206739665489930",
  "1361726772374147112",
];

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function sample<T>(data: T[], size: number, seed: number = 0xdeadbeef): T[] {
  // create a shallow copy so we dont mutate the original data
  const result = [...data];
  const count = Math.min(size, result.length); // cap size to data length so it never overflows

  // fisher-yates style shuffle
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(seededRandom(seed + i) * (result.length - i));
    [result[i], result[j]] = [result[j], result[i]]; // swap ith and jth elements in result array
  }

  // return the first n elements which are now randomly populated
  return result.slice(0, count);
}

function computeSampledTiers(supporters: Supporter[]) {
  const validSupporters = supporters.filter(
    (s) =>
      !EXCLUDED_IDS.includes(s.id) && s.premiumtype >= 1 && s.premiumtype <= 3,
  );

  const seed = parseInt(
    new Date().toISOString().slice(0, 16).replace(/[-T:]/g, ""), // seed format: YYYYMMDDHHmm
  );

  return {
    tier3Supporters: sample(
      validSupporters.filter((s) => s.premiumtype === 3),
      MAX_SUPPORTERS_PER_TIER,
      seed,
    ),
    tier2Supporters: sample(
      validSupporters.filter((s) => s.premiumtype === 2),
      MAX_SUPPORTERS_PER_TIER,
      seed,
    ),
    tier1Supporters: sample(
      validSupporters.filter((s) => s.premiumtype === 1),
      MAX_SUPPORTERS_PER_TIER,
      seed,
    ),
  };
}

export default function SupportersSection({
  supporters,
}: SupportersSectionProps) {
  const BADGE_BASE_URL =
    "https://assets.jailbreakchangelogs.xyz/assets/website_icons";

  const [sampledTiers, setSampledTiers] = useState<{
    tier3Supporters: Supporter[];
    tier2Supporters: Supporter[];
    tier1Supporters: Supporter[];
  }>(() => computeSampledTiers(supporters));

  useEffect(() => {
    setSampledTiers(computeSampledTiers(supporters));
  }, [supporters]);

  const renderSupporterCard = (supporter: Supporter) => (
    <div
      key={supporter.id}
      className="border-border-primary bg-secondary-bg hover:border-border-focus hover:shadow-card-shadow shrink-0 rounded-xl border p-6 shadow-md transition-all duration-200"
      style={{ width: "280px" }}
    >
      <div className="flex flex-col items-center space-y-4">
        <UserAvatar
          userId={supporter.id}
          avatarHash={supporter.avatar || null}
          username={supporter.username}
          size={64}
          showBadge={false}
          premiumType={supporter.premiumtype}
          settings={{ avatar_discord: 1 }}
        />
        <div className="min-w-0 flex-1 text-center">
          <Link href={`/users/${supporter.id}`} prefetch={false}>
            <h3 className="text-primary-text hover:text-link truncate text-base font-semibold transition-colors">
              {supporter.global_name && supporter.global_name !== "None"
                ? supporter.global_name
                : supporter.username}
            </h3>
          </Link>
          <p className="text-secondary-text truncate text-sm">
            @{supporter.username}
          </p>
          <div className="mt-3 flex justify-center">
            <Image
              src={`${BADGE_BASE_URL}/jbcl_supporter_${supporter.premiumtype}.svg`}
              alt={`Supporter ${supporter.premiumtype === 1 ? "I" : supporter.premiumtype === 2 ? "II" : "III"}`}
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderTierSection = (
    tierSupporters: Supporter[],
    tierName: string,
    gradientClass: string,
  ) => {
    if (tierSupporters.length === 0) return null;

    return (
      <div className="mb-12">
        <div className="mb-6 flex justify-center">
          <h3
            className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-2xl font-bold text-black ${gradientClass}`}
          >
            {tierName}
          </h3>
        </div>

        {/* Mobile: Scrollable Container */}
        <div className="relative lg:hidden">
          <div className="from-primary-bg pointer-events-none absolute top-0 left-0 z-10 h-full w-8 bg-linear-to-r to-transparent"></div>
          <div className="from-primary-bg pointer-events-none absolute top-0 right-0 z-10 h-full w-8 bg-gradient-to-l to-transparent"></div>

          <div className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
            {tierSupporters.map((supporter) => (
              <div key={supporter.id} className="snap-center">
                {renderSupporterCard(supporter)}
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: Auto-scrolling Carousel */}
        <div className="relative hidden lg:block">
          <div className="from-primary-bg pointer-events-none absolute top-0 left-0 z-10 h-full w-20 bg-linear-to-r to-transparent"></div>
          <div className="from-primary-bg pointer-events-none absolute top-0 right-0 z-10 h-full w-20 bg-gradient-to-l to-transparent"></div>

          <SupporterCarousel speed={0.5}>
            {tierSupporters.map((supporter) => (
              <div key={supporter.id}>{renderSupporterCard(supporter)}</div>
            ))}
          </SupporterCarousel>
        </div>
      </div>
    );
  };

  const hasAnySupporters =
    sampledTiers.tier3Supporters.length > 0 ||
    sampledTiers.tier2Supporters.length > 0 ||
    sampledTiers.tier1Supporters.length > 0;

  if (!hasAnySupporters) {
    return null;
  }

  return (
    <div id="supporters-section" className="mt-8 py-8">
      <h2 className="text-primary-text mb-12 text-center text-3xl font-bold lg:text-4xl">
        Made possible by our{" "}
        <span className="text-button-info underline">supporters</span>
      </h2>

      <div className="container mx-auto px-4">
        {renderTierSection(
          sampledTiers.tier3Supporters,
          "Supporter III",
          "bg-linear-to-r from-[#FFD700] to-[#DAA520]",
        )}
        {renderTierSection(
          sampledTiers.tier2Supporters,
          "Supporter II",
          "bg-linear-to-r from-[#C0C0C0] to-[#A9A9A9]",
        )}
        {renderTierSection(
          sampledTiers.tier1Supporters,
          "Supporter I",
          "bg-linear-to-r from-[#CD7F32] to-[#B87333]",
        )}
      </div>
    </div>
  );
}
