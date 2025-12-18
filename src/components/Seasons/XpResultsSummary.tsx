import { CalculationResults, Season } from "@/types/seasons";
import { Icon } from "../ui/IconWrapper";
import XpProgressBar from "@/components/Inventory/XpProgressBar";
import { useState, useEffect } from "react";

interface XpResultsSummaryProps {
  results: CalculationResults;
  season: Season;
}

export default function XpResultsSummary({
  results,
  season,
}: XpResultsSummaryProps) {
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [xpMode, setXpMode] = useState<"normal" | "double">(() => {
    const now = Date.now();
    const doubleXpStart = new Date(
      results.importantDates.doubleXpStart,
    ).getTime();
    const seasonEnd = new Date(results.importantDates.seasonEnds).getTime();
    return now >= doubleXpStart && now <= seasonEnd ? "double" : "normal";
  });

  // Check if Double XP is currently live
  const doubleXpStartTime = new Date(
    results.importantDates.doubleXpStart,
  ).getTime();
  const seasonEndTime = new Date(results.importantDates.seasonEnds).getTime();
  const isDoubleXpLive =
    currentTime >= doubleXpStartTime && currentTime <= seasonEndTime;

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (achievable: boolean) =>
    achievable ? (
      <Icon icon="fa:check" className="text-green-400" inline={true} />
    ) : (
      <Icon icon="fa:times" className="text-red-400" inline={true} />
    );

  // Helper function to calculate XP within current level
  const getXpWithinCurrentLevel = () => {
    const xpData = season.xp_data;

    // Constants from the season data
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

    // Calculate XP within current level
    const totalXpForCurrentLevel = getExpFromLevel(results.currentLevel);
    return results.currentXp - totalXpForCurrentLevel;
  };

  // Get current mode results
  const getCurrentModeResults = () => {
    if (xpMode === "double") {
      return {
        noPass: results.doubleXpResults?.noPass
          ? {
              ...results.doubleXpResults.noPass,
              days: Math.ceil(
                (new Date(
                  results.doubleXpResults.noPass.completionDate,
                ).getTime() -
                  currentTime) /
                  (1000 * 60 * 60 * 24),
              ),
            }
          : undefined,
        withPass: results.doubleXpResults?.withPass
          ? {
              ...results.doubleXpResults.withPass,
              days: Math.ceil(
                (new Date(
                  results.doubleXpResults.withPass.completionDate,
                ).getTime() -
                  currentTime) /
                  (1000 * 60 * 60 * 24),
              ),
            }
          : undefined,
      };
    }
    return {
      noPass: {
        achievable: results.achievableNoPass,
        completionDate: results.timeNoPass.completionDate,
        days: results.timeNoPass.days,
      },
      withPass: {
        achievable: results.achievableWithPass,
        completionDate: results.timeWithPass.completionDate,
        days: results.timeWithPass.days,
      },
    };
  };

  const currentResults = getCurrentModeResults();

  // Determine overall status
  const getOverallStatus = () => {
    const canReachWithoutPass = currentResults.noPass?.achievable;
    const canReachWithPass = currentResults.withPass?.achievable;

    if (canReachWithoutPass && canReachWithPass) {
      return {
        type: "success",
        message: "You can reach your target level!",
        icon: (
          <Icon
            icon="mdi:party-popper"
            className="text-green-400"
            inline={true}
          />
        ),
      };
    } else if (!canReachWithoutPass && canReachWithPass) {
      return {
        type: "warning",
        message: "Season Pass required",
        subtitle: "You can reach your target, but only with a Season Pass.",
        icon: (
          <Icon
            icon="si:alert-fill"
            className="text-yellow-400"
            inline={true}
          />
        ),
      };
    } else if (!canReachWithoutPass && !canReachWithPass) {
      return {
        type: "error",
        message: "Target not achievable",
        subtitle: "Consider focusing on getting as close as possible.",
        icon: <Icon icon="fa:times" className="text-red-400" inline={true} />,
      };
    }
    return {
      type: "info",
      message: "Check your progress",
      subtitle: "Review the options below to plan your strategy.",
      icon: (
        <Icon icon="mdi:chart-line" className="text-blue-400" inline={true} />
      ),
    };
  };

  const status = getOverallStatus();

  return (
    <div className="space-y-6">
      {/* Main Status Card */}
      <div className="border-border-primary bg-secondary-bg hover:border-border-focus rounded-lg border p-6">
        {/* XP Mode Toggle */}
        <div className="mb-6 overflow-x-auto">
          <div role="tablist" className="tabs min-w-max">
            <button
              role="tab"
              aria-selected={xpMode === "normal"}
              onClick={() => setXpMode("normal")}
              className={`tab ${xpMode === "normal" ? "tab-active" : ""}`}
            >
              Normal XP
            </button>
            <button
              role="tab"
              aria-selected={xpMode === "double"}
              onClick={() => setXpMode("double")}
              className={`tab ${xpMode === "double" ? "tab-active" : ""}`}
            >
              Double XP Weekend
            </button>
          </div>
        </div>

        <div className="mb-6 text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <span className="text-2xl">{status.icon}</span>
            <h3
              id="season-progress-summary"
              className="text-primary-text text-2xl font-bold"
            >
              {status.message}
            </h3>
          </div>
          <p className="text-secondary-text">{status.subtitle}</p>
          {isDoubleXpLive && (
            <div
              className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2"
              style={{
                backgroundColor: "var(--color-status-success)",
                color: "white",
              }}
            >
              <Icon
                icon="mdi:lightning-bolt"
                style={{ color: "white" }}
                inline={true}
              />
              <span className="text-sm font-semibold">Double XP is LIVE!</span>
            </div>
          )}
        </div>

        {/* Progress Overview */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="text-center">
            <div className="text-secondary-text text-xs">Current Level</div>
            <div className="text-primary-text text-xl font-bold">
              {results.currentLevel}
            </div>
          </div>
          <div className="text-center">
            <div className="text-secondary-text text-xs">Total XP</div>
            <div className="text-primary-text text-xl font-bold">
              {results.currentXp.toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <div className="text-secondary-text text-xs">XP Needed</div>
            <div className="text-primary-text text-xl font-bold">
              {results.xpNeeded.toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <div className="text-secondary-text text-xs">Target XP</div>
            <div className="text-primary-text text-xl font-bold">
              {results.requiredXp.toLocaleString()}
            </div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="mb-6">
          <XpProgressBar
            currentLevel={results.currentLevel}
            currentXp={getXpWithinCurrentLevel()}
            season={season}
          />
        </div>

        {/* Results Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Without Season Pass */}
          <div
            className={`rounded-lg border p-3 ${
              currentResults.noPass?.achievable
                ? "border-green-400 bg-green-400/10"
                : "border-red-400 bg-red-400/10"
            }`}
          >
            <div className="mb-3">
              <h4 className="text-primary-text font-semibold">
                Non-Season Pass Owner
                <span className="text-secondary-text ml-2 text-sm font-normal">
                  ({xpMode === "normal" ? "Normal XP" : "Double XP Weekend"})
                </span>
              </h4>
            </div>
            <div className="text-center">
              {currentResults.noPass?.achievable ? (
                <>
                  <div className="mb-2 flex items-center justify-center gap-2">
                    <span className="text-lg">{getStatusIcon(true)}</span>
                    <div className="text-primary-text text-xl font-bold">
                      {currentResults.noPass.days}{" "}
                      {currentResults.noPass.days === 1 ? "day" : "days"}
                    </div>
                  </div>
                  <div className="text-secondary-text text-sm">
                    Complete by: {currentResults.noPass.completionDate}
                  </div>
                  <div className="text-secondary-text mt-1 text-xs">
                    Results may vary (±1 day)
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-lg">{getStatusIcon(false)}</span>
                    <div className="text-lg font-bold text-red-400">
                      Not Achievable
                    </div>
                  </div>
                  <div className="text-secondary-text text-sm">
                    Would complete: {currentResults.noPass?.completionDate}
                  </div>
                  <div className="mt-1 text-xs text-red-400">
                    Past season end date
                  </div>
                </>
              )}
            </div>
          </div>

          {/* With Season Pass */}
          <div
            className={`rounded-lg border p-3 ${
              currentResults.withPass?.achievable
                ? "border-green-400 bg-green-400/10"
                : "border-red-400 bg-red-400/10"
            }`}
          >
            <div className="mb-3">
              <h4 className="text-primary-text font-semibold">
                Season Pass Owner
                <span className="text-secondary-text ml-2 text-sm font-normal">
                  ({xpMode === "normal" ? "Normal XP" : "Double XP Weekend"})
                </span>
              </h4>
            </div>
            <div className="text-center">
              {currentResults.withPass?.achievable ? (
                <>
                  <div className="mb-2 flex items-center justify-center gap-2">
                    <span className="text-lg">{getStatusIcon(true)}</span>
                    <div className="text-primary-text text-xl font-bold">
                      {currentResults.withPass.days}{" "}
                      {currentResults.withPass.days === 1 ? "day" : "days"}
                    </div>
                  </div>
                  <div className="text-secondary-text text-sm">
                    Complete by: {currentResults.withPass.completionDate}
                  </div>
                  <div className="text-secondary-text mt-1 text-xs">
                    Results may vary (±1 day)
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-lg">{getStatusIcon(false)}</span>
                    <div className="text-lg font-bold text-red-400">
                      Not Achievable
                    </div>
                  </div>
                  <div className="text-secondary-text text-sm">
                    Would complete: {currentResults.withPass?.completionDate}
                  </div>
                  <div className="mt-1 text-xs text-red-400">
                    Past season end date
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Inputs summary */}
        <div className="text-secondary-text mt-4 text-center text-xs">
          Based on Level {results.currentLevel},{" "}
          {getXpWithinCurrentLevel().toLocaleString()} XP in current level
        </div>
      </div>

      {/* Important Dates */}
      <div className="border-border-primary bg-secondary-bg hover:border-border-focus rounded-lg border p-6">
        <h3 className="text-primary-text mb-4 text-xl font-semibold">
          Important Season Dates
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="border-border-primary bg-primary-bg hover:border-border-focus rounded-lg border p-4">
            <div className="text-center">
              <div className="text-primary-text text-lg font-semibold">
                Double XP Starts
              </div>
              <div className="text-primary-text text-xl font-bold">
                {results.importantDates.doubleXpStart}
              </div>
              <div className="text-secondary-text mt-1 text-sm">
                Start maximizing your XP gains!
              </div>
            </div>
          </div>
          <div className="border-border-primary bg-primary-bg hover:border-border-focus rounded-lg border p-4">
            <div className="text-center">
              <div className="text-primary-text text-lg font-semibold">
                Season Ends
              </div>
              <div className="text-primary-text text-xl font-bold">
                {results.importantDates.seasonEnds}
              </div>
              <div className="text-secondary-text mt-1 text-sm">
                Final deadline to reach your goal
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
