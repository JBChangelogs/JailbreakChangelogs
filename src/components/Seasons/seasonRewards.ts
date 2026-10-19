import type { Reward } from "@/utils/api/api";

export const rewardImageUrl = (reward: Reward) =>
  `https://assets.jailbreakchangelogs.com${reward.link}`;

// Bonus levels have no banner: the API sends "" or "N/A"
export const hasRewardImage = (reward: Reward) =>
  !!reward.link && reward.link !== "N/A";

// Levels ascending, percentage rewards (e.g. "Top 2%") last
export function sortRewards(rewards: Reward[]) {
  const rank = (r: Reward) => {
    const n = parseInt(r.requirement.match(/\d+/)?.[0] || "0");
    return r.requirement.includes("%") ? 1000 + n : n;
  };
  return [...rewards].sort((a, b) => rank(a) - rank(b));
}
