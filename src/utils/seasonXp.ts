import type { Season } from "@/types/seasons";

export function getExpFromLevel(season: Season, targetLevel: number) {
  const xpData = season.xp_data;
  const rates = xpData.xp_rates;
  const totalPossibleExp =
    rates.efficiency *
    (rates.avgXpPerContract * rates.contractsPerDay * rates.totalDays +
      rates.maxDailyXp * rates.totalDays);
  if (targetLevel <= 0) return 0;

  const curveK = rates.curveK;
  let result;

  if (curveK === 1) {
    result = totalPossibleExp / (xpData.targetLevel - 1);
  } else {
    result =
      (totalPossibleExp * (1 - curveK)) /
      (1 - Math.pow(curveK, xpData.targetLevel - 1));
  }

  let calculatedExp;
  if (curveK === 1) {
    calculatedExp = result * (targetLevel - 1);
  } else {
    calculatedExp =
      (result * (1 - Math.pow(curveK, targetLevel - 1))) / (1 - curveK);
  }

  let roundedExp = Math.floor(calculatedExp);
  if (0.5 <= calculatedExp - roundedExp) {
    roundedExp += 1;
  }
  return roundedExp;
}
