"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "react-hot-toast";
import XpCalculatorForm from "./XpCalculatorForm";
import XpResultsSummary from "./XpResultsSummary";
import { Season, CalculationResults, DoubleXpResult } from "@/types/seasons";

interface XpCalculatorProps {
  season: Season;
}

export default function XpCalculator({ season }: XpCalculatorProps) {
  "use memo";
  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentXp, setCurrentXp] = useState(0);
  const [results, setResults] = useState<CalculationResults | null>(null);
  const [currentTime, setCurrentTime] = useState(() =>
    Math.floor(Date.now() / 1000),
  );
  const resultsRef = useRef<HTMLDivElement | null>(null);

  // Check if season has ended
  const seasonHasEnded = currentTime >= season.end_date;

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Calculate results when button is clicked
  const handleCalculate = () => {
    if (!currentLevel) {
      return;
    }

    if (currentLevel >= season.xp_data.targetLevel) {
      return;
    }

    const xpData = season.xp_data;
    const currentTime = Math.floor(Date.now() / 1000);

    // Constants from the season data
    const constants = {
      MAX_DAILY_EXP: xpData.xp_rates.maxDailyXp,
      MAX_DAILY_EXP_SEASON_PASS: xpData.xp_rates.maxDailyXpWithPass,
      AVG_EXP_PER_CONTRACT: xpData.xp_rates.avgXpPerContract,
      TOTAL_DAYS: xpData.xp_rates.totalDays,
      CONTRACTS_PER_DAY: xpData.xp_rates.contractsPerDay,
      EFFICIENCY: xpData.xp_rates.efficiency,
      CURVE_K: xpData.xp_rates.curveK,
      DOUBLE_XP_TIME: xpData.doubleXpDuration,
      SEASON_ENDS: season.end_date,
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

    // Calculate XP per week
    const expPerWeek = (hasGamePass: boolean) => {
      if (hasGamePass) {
        return (
          constants.MAX_DAILY_EXP_SEASON_PASS * 7 +
          constants.AVG_EXP_PER_CONTRACT * 6
        );
      } else {
        return constants.MAX_DAILY_EXP * 7 + constants.AVG_EXP_PER_CONTRACT * 4;
      }
    };

    const expPerWeekDouble = (hasGamePass: boolean) => {
      if (hasGamePass) {
        return (
          constants.MAX_DAILY_EXP_SEASON_PASS * 2 * 7 +
          constants.AVG_EXP_PER_CONTRACT * 2 * 6
        );
      } else {
        return (
          constants.MAX_DAILY_EXP * 2 * 7 +
          constants.AVG_EXP_PER_CONTRACT * 2 * 4
        );
      }
    };

    // Current progress
    const myExp = getExpFromLevel(currentLevel) + currentXp;
    const targetLevelExp = getExpFromLevel(season.xp_data.targetLevel);
    const xpNeeded = targetLevelExp - myExp;

    // Time calculations
    const howLongNoGamePassDays = Math.max(
      0,
      Math.ceil(((targetLevelExp - myExp) / expPerWeek(false)) * 7),
    );
    const howLongWithGamePassDays = Math.max(
      0,
      Math.ceil(((targetLevelExp - myExp) / expPerWeek(true)) * 7),
    );

    const targetLevelDateNoGamePass =
      currentTime + howLongNoGamePassDays * 86400;
    const targetLevelDateWithGamePass =
      currentTime + howLongWithGamePassDays * 86400;

    // Check if achievable
    const doubleXpStart = constants.SEASON_ENDS - constants.DOUBLE_XP_TIME;
    const alreadyReachedTarget = xpNeeded <= 0;
    const achievableNoPass =
      alreadyReachedTarget || targetLevelDateNoGamePass < constants.SEASON_ENDS;
    const achievableWithPass =
      alreadyReachedTarget ||
      targetLevelDateWithGamePass < constants.SEASON_ENDS;

    // Double XP calculations (always calculate for comparison)
    let doubleXpResults: {
      noPass: DoubleXpResult;
      withPass: DoubleXpResult;
    } | null = null;

    // Calculate Double XP days using the old method
    const newDaysNoPass = Math.max(
      0,
      (targetLevelExp - myExp) / expPerWeek(false) -
        1 +
        (targetLevelExp - myExp) / expPerWeekDouble(false),
    );
    const newLvlDateNoPass = Math.ceil(newDaysNoPass * 7) * 86400;
    const newDaysWithPass = Math.max(
      0,
      (targetLevelExp - myExp) / expPerWeek(true) -
        1 +
        (targetLevelExp - myExp) / expPerWeekDouble(true),
    );
    const newLvlDateWithPass = Math.ceil(newDaysWithPass * 7) * 86400;

    doubleXpResults = {
      noPass: {
        achievable: currentTime + newLvlDateNoPass < constants.SEASON_ENDS,
        completionDate: new Date(
          (currentTime + newLvlDateNoPass) * 1000,
        ).toLocaleDateString("en-US", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      },
      withPass: {
        achievable: currentTime + newLvlDateWithPass < constants.SEASON_ENDS,
        completionDate: new Date(
          (currentTime + newLvlDateWithPass) * 1000,
        ).toLocaleDateString("en-US", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      },
    };

    setResults({
      currentLevel,
      currentXp: myExp,
      requiredXp: targetLevelExp,
      xpNeeded,
      timeNoPass: {
        days: howLongNoGamePassDays,
        completionDate: new Date(
          targetLevelDateNoGamePass * 1000,
        ).toLocaleDateString("en-US", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      },
      timeWithPass: {
        days: howLongWithGamePassDays,
        completionDate: new Date(
          targetLevelDateWithGamePass * 1000,
        ).toLocaleDateString("en-US", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      },
      achievableNoPass,
      achievableWithPass,
      doubleXpResults,
      importantDates: {
        doubleXpStart: new Date(doubleXpStart * 1000).toLocaleString(
          undefined,
          {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          },
        ),
        seasonEnds: new Date(constants.SEASON_ENDS * 1000).toLocaleString(
          undefined,
          {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          },
        ),
      },
    });

    toast.success("Results updated below.");
  };

  // If season has ended, show a different UI
  if (seasonHasEnded) {
    return (
      <div className="border-border-primary hover:border-border-focus bg-secondary-bg mb-8 rounded-lg border p-6">
        <div className="text-center">
          <div className="mb-4">
            <div className="from-button-danger to-button-danger/80 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br">
              <svg
                className="text-primary-text h-8 w-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-primary-text mb-2 text-2xl font-bold">
              This Season Has Ended
            </h2>
            <p className="text-secondary-text mb-6">
              The XP calculator is no longer available for this season.
            </p>
          </div>

          <div className="border-border-primary hover:border-border-focus bg-primary-bg rounded-lg border p-4">
            <div className="mb-3 flex items-center justify-center gap-3">
              <svg
                className="text-button-info h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span className="text-button-info font-semibold">
                Check Back Soon!
              </span>
            </div>
            <p className="bg-primary-bg text-secondary-text text-sm">
              The XP calculator will be available again when Season{" "}
              {season.season + 1} begins.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <XpCalculatorForm
        currentLevel={currentLevel}
        currentXp={currentXp}
        targetLevel={season.xp_data.targetLevel}
        onLevelChange={setCurrentLevel}
        onXpChange={setCurrentXp}
        onCalculate={handleCalculate}
        season={season}
      />

      <div ref={resultsRef}>
        {results && <XpResultsSummary results={results} season={season} />}
      </div>
    </>
  );
}
