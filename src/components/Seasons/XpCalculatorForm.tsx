import ImageModal from "@/components/ui/ImageModal";
import { Season } from "@/types/seasons";

interface XpCalculatorFormProps {
  currentLevel: number;
  currentXp: number | string;
  targetLevel: number;
  onLevelChange: (level: number) => void;
  onXpChange: (xp: number | string) => void;
  onCalculate: () => void;
  season: Season;
  includeDailyXp: boolean;
  includeContracts: boolean;
  onIncludeDailyXpChange: (include: boolean) => void;
  onIncludeContractsChange: (include: boolean) => void;
}

export default function XpCalculatorForm({
  currentLevel,
  currentXp,
  targetLevel,
  onLevelChange,
  onXpChange,
  onCalculate,
  season,
  includeDailyXp,
  includeContracts,
  onIncludeDailyXpChange,
  onIncludeContractsChange,
}: XpCalculatorFormProps) {
  // Calculate max XP for the current level (XP needed to reach the NEXT level)
  const getMaxXpForLevel = (level: number) => {
    if (!season || level <= 0) return 0;

    const xpData = season.xp_data;
    const constants = {
      MAX_DAILY_EXP: xpData.xp_rates.maxDailyXp,
      MAX_DAILY_EXP_SEASON_PASS: xpData.xp_rates.maxDailyXpWithPass,
      AVG_EXP_PER_CONTRACT: xpData.xp_rates.avgXpPerContract,
      TOTAL_DAYS: xpData.xp_rates.totalDays,
      CONTRACTS_PER_DAY: xpData.xp_rates.contractsPerDay,
      EFFICIENCY: xpData.xp_rates.efficiency,
      CURVE_K: xpData.xp_rates.curveK,
    };

    // Calculate total possible XP
    const totalPossibleExp =
      constants.EFFICIENCY *
      (constants.AVG_EXP_PER_CONTRACT *
        constants.CONTRACTS_PER_DAY *
        constants.TOTAL_DAYS +
        constants.MAX_DAILY_EXP * constants.TOTAL_DAYS);

    // Function to get XP required for a level
    function getExpFromLevel(targetLevel: number) {
      if (targetLevel <= 0) return 0;

      const curveK = constants.CURVE_K;
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

    // Get total XP for next level and current level
    const totalXpForNextLevel = getExpFromLevel(level + 1);
    const totalXpForCurrentLevel = getExpFromLevel(level);

    // Return the XP required to reach the next level
    return totalXpForNextLevel - totalXpForCurrentLevel;
  };

  const maxXpForCurrentLevel = getMaxXpForLevel(currentLevel);
  return (
    <div className="border-border-primary bg-secondary-bg hover:border-border-focus mb-8 rounded-lg border p-6">
      <h2 className="text-primary-text mb-6 text-2xl font-semibold">
        🎯 XP Progress Calculator
      </h2>

      {/* Example image showing how to get XP values */}
      <div className="mb-6 text-center">
        <ImageModal
          src="/assets/images/Season_Exp.png"
          alt="Example showing how to find your current level and XP in Roblox Jailbreak"
          width={400}
          height={300}
          className="mx-auto w-full max-w-sm"
          priority
        />
        <p className="text-secondary-text mt-2 flex items-center justify-center gap-2 text-center text-sm">
          Use this image as a reference to find your current level and XP
          progress
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="text-primary-text mb-2 block text-sm font-medium">
            Current Level
          </label>
          <select
            className="select bg-primary-bg text-primary-text h-[56px] min-h-[56px] w-full"
            value={currentLevel}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              const newLevel = parseInt(e.target.value);
              onLevelChange(newLevel);
              onXpChange(""); // Reset XP when level changes
            }}
          >
            <option value="" disabled>
              Select your level
            </option>
            {Array.from({ length: targetLevel - 1 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                Level {i + 1}
              </option>
            ))}
          </select>
          <div className="text-secondary-text mt-1 text-xs">
            Select your current level (
            <span className="font-bold">1-{targetLevel - 1}</span>)
          </div>
        </div>

        <div>
          <label className="text-primary-text mb-2 block text-sm font-medium">
            XP in Current Level
          </label>
          <input
            type="number"
            min="0"
            max={maxXpForCurrentLevel}
            value={currentXp}
            onChange={(e) => onXpChange(e.target.value)}
            className="border-button-info bg-form-input text-primary-text h-[56px] min-h-[56px] w-full rounded-lg border px-3 py-3 focus:outline-none"
            placeholder={`0-${maxXpForCurrentLevel}`}
          />
          <div className="text-secondary-text mt-1 text-xs">
            XP progress within{" "}
            <span className="font-bold">Level {currentLevel}</span> (0-
            <span className="font-bold">
              {maxXpForCurrentLevel.toLocaleString()} XP
            </span>{" "}
            needed to reach{" "}
            <span className="font-bold">Level {currentLevel + 1}</span>)
          </div>
        </div>
      </div>

      <div className="border-border-primary bg-primary-bg mb-6 rounded-lg border p-4">
        <p className="text-secondary-text mb-3 text-xs">
          These options apply to the entire remaining season.
        </p>
        <div className="space-y-3">
          <label className="text-primary-text flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={includeDailyXp}
              onChange={(e) => onIncludeDailyXpChange(e.target.checked)}
              className="text-button-info focus:ring-button-info h-4 w-4 cursor-pointer rounded"
            />
            <div className="flex-1">
              <span className="font-medium">Include Daily XP</span>
            </div>
          </label>
          <label className="text-primary-text flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={includeContracts}
              onChange={(e) => onIncludeContractsChange(e.target.checked)}
              className="text-button-info focus:ring-button-info h-4 w-4 cursor-pointer rounded"
            />
            <div className="flex-1">
              <span className="font-medium">Include Weekly Contracts</span>
            </div>
          </label>
        </div>
        {!includeDailyXp && !includeContracts && (
          <p className="text-button-danger mt-3 text-xs">
            At least one XP source must be enabled
          </p>
        )}
      </div>

      <div className="flex justify-center">
        <button
          onClick={onCalculate}
          disabled={!currentLevel || (!includeDailyXp && !includeContracts)}
          className={`flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
            !currentLevel || (!includeDailyXp && !includeContracts)
              ? "border-button-secondary bg-button-secondary text-secondary-text cursor-not-allowed"
              : "border-button-info bg-button-info text-form-button-text hover:bg-button-info-hover cursor-pointer"
          }`}
        >
          Will I Make It?
        </button>
      </div>
    </div>
  );
}
