import ImageModal from "@/components/ui/ImageModal";
import { Button } from "@/components/ui/button";
import { Season } from "@/types/seasons";
import { Icon } from "@/components/ui/IconWrapper";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const levelOptions = Array.from({ length: targetLevel - 1 }, (_, i) => i + 1);
  const currentLevelLabel = currentLevel
    ? `Level ${currentLevel}`
    : "Select your level";

  return (
    <div className="border-border-primary bg-secondary-bg hover:border-border-focus mb-8 rounded-lg border p-6">
      <h2 className="text-primary-text mb-6 text-2xl font-semibold">
        🎯 XP Progress Calculator
      </h2>

      {/* Example image showing how to get XP values */}
      <div className="mb-6 text-center">
        <ImageModal
          src="/assets/images/Season_Exp.webp"
          alt="Example showing how to find your current level and XP in Roblox Jailbreak"
          width={400}
          height={300}
          className="mx-auto w-full max-w-sm"
          fetchPriority="high"
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="border-border-primary bg-primary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus flex h-[56px] w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all duration-300 focus:ring-1 focus:outline-none"
                aria-label="Select your level"
              >
                <span className="truncate">{currentLevelLabel}</span>
                <Icon
                  icon="heroicons:chevron-down"
                  className="text-secondary-text h-5 w-5"
                  inline={true}
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="border-border-primary bg-primary-bg text-primary-text scrollbar-thin max-h-[280px] w-[var(--radix-popper-anchor-width)] min-w-[var(--radix-popper-anchor-width)] overflow-x-hidden overflow-y-auto rounded-xl border p-1 shadow-lg"
            >
              <DropdownMenuRadioGroup
                value={currentLevel ? currentLevel.toString() : ""}
                onValueChange={(value) => {
                  const newLevel = parseInt(value, 10);
                  if (Number.isNaN(newLevel)) return;
                  onLevelChange(newLevel);
                  onXpChange(""); // Reset XP when level changes
                }}
              >
                {levelOptions.map((level) => (
                  <DropdownMenuRadioItem
                    key={level}
                    value={level.toString()}
                    className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                  >
                    Level {level}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
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
            className="border-button-info bg-form-input text-primary-text h-[56px] min-h-[56px] w-full rounded-lg border px-3 py-2 focus:outline-none"
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
        <Button
          onClick={onCalculate}
          disabled={!currentLevel || (!includeDailyXp && !includeContracts)}
          data-umami-event="Will I Make It Calculate"
        >
          Will I Make It?
        </Button>
      </div>
    </div>
  );
}
