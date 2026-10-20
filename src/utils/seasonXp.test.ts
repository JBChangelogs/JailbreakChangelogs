import { expect, test } from "bun:test";
import type { Season } from "@/types/seasons";
import { getExpFromLevel } from "./seasonXp";

const season: Season = {
  season: 30,
  title: "Test season",
  description: "",
  is_current: 1,
  start_date: 0,
  end_date: 0,
  rewards: [],
  xp_data: {
    targetLevel: 10,
    doubleXpDuration: 0,
    xp_rates: {
      curveK: 1,
      totalDays: 60,
      efficiency: 0.8,
      maxDailyXp: 80,
      contractsPerDay: 4 / 7,
      avgXpPerContract: 30,
      maxDailyXpWithPass: 120,
    },
  },
};

// Expected totals captured from all six original implementations before extraction.
test("season XP preserves linear and curved totals, rounding, and extrapolation", () => {
  for (const [curveK, expected] of [
    [1, [0, 518, 1036, 1554, 2072, 2590, 3109, 3627, 4145, 4663, 5181]],
    [1.15, [-0, 278, 597, 965, 1387, 1873, 2432, 3074, 3813, 4663, 5640]],
    [0.9, [0, 761, 1446, 2063, 2618, 3117, 3567, 3971, 4335, 4663, 4958]],
  ] as const) {
    const input = {
      ...season,
      xp_data: {
        ...season.xp_data,
        xp_rates: { ...season.xp_data.xp_rates, curveK },
      },
    };
    expect(getExpFromLevel(input, -1)).toBe(0);
    expect(getExpFromLevel(input, 0)).toBe(0);
    expect(
      Array.from({ length: 11 }, (_, i) => getExpFromLevel(input, i + 1)),
    ).toEqual([...expected]);
  }
});
