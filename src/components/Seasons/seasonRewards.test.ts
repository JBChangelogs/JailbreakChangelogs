import { expect, test } from "bun:test";
import type { Reward } from "@/utils/api/api";
import { hasRewardImage, sortRewards } from "./seasonRewards";

const reward = (id: number, requirement: string, link = "/x.webp"): Reward => ({
  id,
  season_number: 33,
  item: `Item ${id}`,
  requirement,
  link,
  exclusive: "False",
  bonus: "False",
});

test("sorts levels numerically with percentage rewards last, without mutating input", () => {
  const input = [
    reward(1, "Top 2%"),
    reward(2, "Level 10"),
    reward(3, "Level 2"),
    reward(4, "Top 1%"),
    reward(5, "Level 9"),
  ];
  expect(sortRewards(input).map((r) => r.requirement)).toEqual([
    "Level 2",
    "Level 9",
    "Level 10",
    "Top 1%",
    "Top 2%",
  ]);
  expect(input[0].requirement).toBe("Top 2%");
});

test("bonus levels without a banner are treated as image-less", () => {
  expect(hasRewardImage(reward(1, "Level 2"))).toBe(true);
  expect(hasRewardImage(reward(2, "Level 2", "N/A"))).toBe(false);
  expect(hasRewardImage(reward(3, "Level 2", ""))).toBe(false);
});
