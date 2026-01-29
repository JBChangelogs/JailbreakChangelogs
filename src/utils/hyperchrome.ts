export const HYPERCHROME_PITY_PUBLIC = [225, 470, 740, 870, 1334];
export const HYPERCHROME_PITY_SMALL = [337, 709, 1009, 1305, 2001];

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
