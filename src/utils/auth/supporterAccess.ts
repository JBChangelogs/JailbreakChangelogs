import { HIDE_ADS_REQUIRED_TIER } from "@/config/supporter";

const MAX_SUPPORTER_TIER = 3;

export function canHideAdsForPremiumType(premiumType?: number | null): boolean {
  const tier = premiumType ?? 0;
  return tier >= HIDE_ADS_REQUIRED_TIER && tier <= MAX_SUPPORTER_TIER;
}

const BADGE_BASE_URL =
  "https://assets.jailbreakchangelogs.com/assets/website_icons";

/** A supporter tier's badge image; undefined for the free tier. */
export const supporterBadgeUrl = (level: number) =>
  level >= 1 && level <= MAX_SUPPORTER_TIER
    ? `${BADGE_BASE_URL}/jbcl_supporter_${level}.svg`
    : undefined;

export const getSupporterGiftTierLabel = (level: number) => {
  switch (level) {
    case 1:
      return "Supporter One Gift";
    case 2:
      return "Supporter Two Gift";
    case 3:
      return "Supporter Three Gift";
    default:
      return `Supporter Gift ${level}`;
  }
};
