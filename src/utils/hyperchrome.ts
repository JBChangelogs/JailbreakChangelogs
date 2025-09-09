export const HYPERCHROME_PITY = [225, 470, 740, 870, 1334];

export type HyperchromeLevel = 0 | 1 | 2 | 3 | 4;

export function calculateRobberiesToLevelUp(
  currentLevel: HyperchromeLevel,
  currentPityPercent: number,
  isPrivateServer: boolean,
): number {
  const boundedPity = Math.min(Math.max(currentPityPercent, 0), 100);
  const base = HYPERCHROME_PITY[currentLevel];
  const privateMultiplier = isPrivateServer ? 1.5 : 1;
  const remainingPercent = (100 - boundedPity) / 100;
  return Math.ceil(base * remainingPercent * privateMultiplier);
}

export function calculateAllLevelPercentages(
  currentLevel: HyperchromeLevel,
  currentPityPercent: number,
): string[] {
  const baseForLevel = HYPERCHROME_PITY[currentLevel];
  const currentProgressAbsolute = Math.floor(
    (baseForLevel * Math.min(Math.max(currentPityPercent, 0), 100)) / 100,
  );

  return HYPERCHROME_PITY.map((value) =>
    ((currentProgressAbsolute / value) * 100).toFixed(2),
  );
}
