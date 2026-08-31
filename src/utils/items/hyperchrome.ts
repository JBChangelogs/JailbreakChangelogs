const HYPERCHROME_CHANCE_DENOMINATORS = [179, 378, 608, 696, 1068] as const;
const HYPERCHROME_PITY_MULTIPLIER = 1.25;
const HYPERCHROME_SMALL_SERVER_ODDS_MULTIPLIER = 0.66;

export const HYPERCHROME_PITY_PUBLIC = HYPERCHROME_CHANCE_DENOMINATORS.map(
  (chanceDenominator) =>
    Math.ceil(chanceDenominator * HYPERCHROME_PITY_MULTIPLIER),
);

export const HYPERCHROME_PITY_SMALL = HYPERCHROME_CHANCE_DENOMINATORS.map(
  (chanceDenominator) =>
    Math.ceil(
      (chanceDenominator / HYPERCHROME_SMALL_SERVER_ODDS_MULTIPLIER) *
        HYPERCHROME_PITY_MULTIPLIER,
    ),
);

// The Mansion (CEO) robbery only doubles the natural drop chance
// (1/500 vs. the normal Level 5 rate of 1/1068). Pity is tracked per
// HyperChrome color, not per robbery source, so the guaranteed-by-pity
// threshold is the same Level 5 total regardless of where the roll came from.
export const HYPERCHROME_MANSION_CHANCE_DENOMINATOR = 500;
export const HYPERCHROME_MANSION_PITY_PUBLIC =
  HYPERCHROME_PITY_PUBLIC[HYPERCHROME_PITY_PUBLIC.length - 1];
export const HYPERCHROME_MANSION_PITY_SMALL =
  HYPERCHROME_PITY_SMALL[HYPERCHROME_PITY_SMALL.length - 1];

export type HyperchromeLevel = 0 | 1 | 2 | 3 | 4;

export function calculateRobberiesToLevelUp(
  currentLevel: HyperchromeLevel,
  currentPityPercent: number,
  isSmallServer: boolean,
): number {
  const pityBases = isSmallServer
    ? HYPERCHROME_PITY_SMALL
    : HYPERCHROME_PITY_PUBLIC;
  const base = pityBases[currentLevel];
  const remainingPercent =
    (100 - Math.min(Math.max(currentPityPercent, 0), 100)) / 100;
  return Math.ceil(base * remainingPercent);
}

export function calculateRobberiesToPublicPityGoal(
  currentLevel: HyperchromeLevel,
  currentPityPercent: number,
  isSmallServer: boolean,
): number {
  const currentPityBase = isSmallServer
    ? HYPERCHROME_PITY_SMALL[currentLevel]
    : HYPERCHROME_PITY_PUBLIC[currentLevel];
  const robberiesDone = (currentPityPercent / 100) * currentPityBase;
  const publicGoal = HYPERCHROME_PITY_PUBLIC[currentLevel];

  return Math.max(0, Math.ceil(publicGoal - robberiesDone));
}

export function calculateAllLevelPercentages(
  currentLevel: HyperchromeLevel,
  currentPityPercent: number,
  isSmallServer: boolean,
): string[] {
  const currentPityBase = isSmallServer
    ? HYPERCHROME_PITY_SMALL[currentLevel]
    : HYPERCHROME_PITY_PUBLIC[currentLevel];
  const robberiesDone = (currentPityPercent / 100) * currentPityBase;

  const targetBases = isSmallServer
    ? HYPERCHROME_PITY_SMALL
    : HYPERCHROME_PITY_PUBLIC;

  return targetBases.map((value) => ((robberiesDone / value) * 100).toFixed(2));
}

export function calculateRobberiesToMansionWildcard(
  currentLevel: HyperchromeLevel,
  currentPityPercent: number,
  isSmallServer: boolean,
): number {
  const currentPityBase = isSmallServer
    ? HYPERCHROME_PITY_SMALL[currentLevel]
    : HYPERCHROME_PITY_PUBLIC[currentLevel];
  const robberiesDone = (currentPityPercent / 100) * currentPityBase;
  const mansionGoal = isSmallServer
    ? HYPERCHROME_MANSION_PITY_SMALL
    : HYPERCHROME_MANSION_PITY_PUBLIC;

  return Math.max(0, Math.ceil(mansionGoal - robberiesDone));
}
