import { HIDE_ADS_REQUIRED_TIER } from "@/config/supporter";

const MAX_SUPPORTER_TIER = 3;

export function canHideAdsForPremiumType(premiumType?: number | null): boolean {
  const tier = premiumType ?? 0;
  return tier >= HIDE_ADS_REQUIRED_TIER && tier <= MAX_SUPPORTER_TIER;
}

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
