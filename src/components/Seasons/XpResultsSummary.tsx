import { CalculationResults, Season } from "@/types/seasons";
import { FaCheck, FaTimes } from "react-icons/fa";
import { IoTime } from "react-icons/io5";
import XpProgressBar from "@/components/Inventory/XpProgressBar";

interface XpResultsSummaryProps {
  results: CalculationResults;
  season: Season;
}

export default function XpResultsSummary({
  results,
  season,
}: XpResultsSummaryProps) {
  const getStatusIcon = (achievable: boolean) =>
    achievable ? (
      <FaCheck className="text-green-400" />
    ) : (
      <FaTimes className="text-red-400" />
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

  const getRecommendation = () => {
    if (results.achievableWithPass && results.achievableNoPass) {
      return {
        type: "success",
        message:
          "Great news! You can reach the target level with or without a Season Pass.",
        details:
          "Consider if the Season Pass is worth the cost for faster progression.",
        tips: [
          "Complete daily contracts for consistent XP gains",
          "Log in daily to maximize daily XP bonuses",
          "Focus on high-value contracts when available",
        ],
      };
    } else if (results.achievableWithPass && !results.achievableNoPass) {
      return {
        type: "warning",
        message: "You can reach the target level, but only with a Season Pass.",
        details: "The Season Pass is essential for your success this season.",
        tips: [
          "Consider purchasing the Season Pass for guaranteed success",
          "Focus on maximizing daily XP limits",
          "Complete all available contracts daily",
        ],
      };
    } else if (results.doubleXpResults?.withPass.achievable) {
      return {
        type: "info",
        message:
          "You can reach the target level using Double XP + Season Pass.",
        details:
          "Focus on maximizing Double XP periods and consider the Season Pass investment.",
        tips: [
          "Mark Double XP start date on your calendar",
          "Consider the Season Pass for better Double XP gains",
          "Prepare to grind intensively during Double XP periods",
        ],
      };
    } else {
      return {
        type: "error",
        message:
          "Unfortunately, reaching the target level this season is not achievable.",
        details:
          "Focus on getting as close as possible and prepare for next season.",
        tips: [
          "Aim to get as close to the target as possible",
          "Learn from this season to prepare better next time",
          "Focus on completing contracts for rewards",
        ],
      };
    }
  };

  const recommendation = getRecommendation();

  return (
    <div className="space-y-6">
      {/* Main Summary Card */}
      <div className="border-stroke bg-secondary-bg rounded-lg border p-6">
        <h3
          id="season-progress-summary"
          className="text-primary-text mb-4 text-2xl font-bold"
        >
          🎯 Your Season Progress Summary
        </h3>

        {/* Recommendation */}
        <div
          className={`mb-6 rounded-lg p-4 ${
            recommendation.type === "success"
              ? "border-button-success bg-secondary-bg border"
              : recommendation.type === "warning"
                ? "border-warning bg-secondary-bg border"
                : recommendation.type === "info"
                  ? "border-button-info bg-secondary-bg border"
                  : "border-button-danger bg-secondary-bg border"
          }`}
        >
          <div className="text-primary-text mb-2 text-lg font-semibold">
            {recommendation.message}
          </div>
          <div className="text-secondary-text mb-3">
            {recommendation.details}
          </div>
        </div>

        {/* Progress Overview */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="text-center">
            <div className="text-primary-text text-2xl font-bold">
              {results.currentLevel}
            </div>
            <div className="text-secondary-text text-sm">Current Level</div>
          </div>
          <div className="text-center">
            <div className="text-primary-text text-2xl font-bold">
              {results.currentXp.toLocaleString()}
            </div>
            <div className="text-secondary-text text-sm">Total XP</div>
          </div>
          <div className="text-center">
            <div className="text-primary-text text-2xl font-bold">
              {results.xpNeeded.toLocaleString()}
            </div>
            <div className="text-secondary-text text-sm">XP Needed</div>
          </div>
          <div className="text-center">
            <div className="text-primary-text text-2xl font-bold">
              {results.requiredXp.toLocaleString()}
            </div>
            <div className="text-secondary-text text-sm">Target XP</div>
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

        {/* Time Estimates */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="border-stroke bg-primary-bg rounded-lg border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-primary-text flex items-center gap-2 font-semibold">
                <IoTime className="text-blue-400" />
                Without Season Pass
              </h4>
              <span className="text-lg">
                {getStatusIcon(results.achievableNoPass)}
              </span>
            </div>
            <div className="text-center">
              <div className="text-primary-text text-2xl font-bold">
                {results.timeNoPass.days}
              </div>
              <div className="text-secondary-text text-sm">
                {results.timeNoPass.days === 1 ? "day" : "days"}
              </div>
              {results.achievableNoPass ? (
                <div className="text-secondary-text mt-1 text-xs">
                  {results.timeNoPass.completionDate}
                </div>
              ) : (
                <div className="mt-1 text-xs text-red-400">
                  Past season end date
                  <br />
                  <span className="text-muted">
                    Would complete: {results.timeNoPass.completionDate}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="border-stroke bg-primary-bg rounded-lg border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-primary-text flex items-center gap-2 font-semibold">
                <IoTime className="text-green-400" />
                With Season Pass
              </h4>
              <span className="text-lg">
                {getStatusIcon(results.achievableWithPass)}
              </span>
            </div>
            <div className="text-center">
              <div className="text-primary-text text-2xl font-bold">
                {results.timeWithPass.days}
              </div>
              <div className="text-secondary-text text-sm">
                {results.timeWithPass.days === 1 ? "day" : "days"}
              </div>
              {results.achievableWithPass ? (
                <div className="text-secondary-text mt-1 text-xs">
                  {results.timeWithPass.completionDate}
                </div>
              ) : (
                <div className="mt-1 text-xs text-red-400">
                  Past season end date
                  <br />
                  <span className="text-muted">
                    Would complete: {results.timeWithPass.completionDate}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* XP Options Analysis */}
      <div className="border-stroke bg-secondary-bg rounded-lg border p-6">
        <h3 className="text-primary-text mb-4 text-xl font-semibold">
          XP Options Analysis
        </h3>
        {new Date() < new Date(results.importantDates.doubleXpStart) && (
          <div className="mb-4 text-sm text-gray-400 italic">
            💡 Double XP analysis will be available starting{" "}
            {results.importantDates.doubleXpStart}
          </div>
        )}

        <div className="space-y-4">
          {/* Without Season Pass Analysis */}
          <div className="border-stroke bg-primary-bg rounded-lg border p-4">
            <h4 className="text-primary-text mb-3 font-semibold">
              Without Season Pass
            </h4>
            <div className="space-y-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                  <span className="flex-shrink-0 text-lg">
                    {results.achievableNoPass ? (
                      <FaCheck className="text-green-400" />
                    ) : (
                      <FaTimes className="text-red-400" />
                    )}
                  </span>
                  <span className="text-primary-text text-sm sm:text-base">
                    Normal XP:{" "}
                    {results.achievableNoPass ? (
                      "Achievable"
                    ) : (
                      <span className="text-button-danger">Not achievable</span>
                    )}
                  </span>
                </div>
                {results.achievableNoPass && (
                  <span className="text-xs text-green-400 sm:text-sm">
                    ({results.timeNoPass.days}{" "}
                    {results.timeNoPass.days === 1 ? "day" : "days"} - Complete
                    by: {results.timeNoPass.completionDate})
                  </span>
                )}
              </div>
              {/* Double XP option - only show after Double XP starts */}
              {results.doubleXpResults?.noPass &&
                new Date() >=
                  new Date(results.importantDates.doubleXpStart) && (
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {results.doubleXpResults.noPass.achievable ? (
                        <FaCheck className="text-green-400" />
                      ) : (
                        <FaTimes className="text-red-400" />
                      )}
                    </span>
                    <span className="text-primary-text">
                      With Double XP:{" "}
                      {results.doubleXpResults.noPass.achievable
                        ? "Achievable (faster completion)"
                        : "Still not achievable"}
                    </span>
                    {results.doubleXpResults.noPass.achievable && (
                      <span className="text-sm text-green-400">
                        (
                        {Math.ceil(
                          (new Date(
                            results.doubleXpResults.noPass.completionDate,
                          ).getTime() -
                            Date.now()) /
                            (1000 * 60 * 60 * 24),
                        )}{" "}
                        {Math.ceil(
                          (new Date(
                            results.doubleXpResults.noPass.completionDate,
                          ).getTime() -
                            Date.now()) /
                            (1000 * 60 * 60 * 24),
                        ) === 1
                          ? "day"
                          : "days"}{" "}
                        - Complete by:{" "}
                        {results.doubleXpResults.noPass.completionDate})
                      </span>
                    )}
                  </div>
                )}
            </div>
          </div>

          {/* With Season Pass Analysis */}
          <div className="border-stroke bg-primary-bg rounded-lg border p-4">
            <h4 className="text-primary-text mb-3 font-semibold">
              With Season Pass
            </h4>
            <div className="space-y-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                  <span className="flex-shrink-0 text-lg">
                    {results.achievableWithPass ? (
                      <FaCheck className="text-green-400" />
                    ) : (
                      <FaTimes className="text-red-400" />
                    )}
                  </span>
                  <span className="text-primary-text text-sm sm:text-base">
                    Normal XP:{" "}
                    {results.achievableWithPass ? (
                      "Achievable"
                    ) : (
                      <span className="text-button-danger">Not achievable</span>
                    )}
                  </span>
                </div>
                {results.achievableWithPass && (
                  <span className="text-xs text-green-400 sm:text-sm">
                    ({results.timeWithPass.days}{" "}
                    {results.timeWithPass.days === 1 ? "day" : "days"} -
                    Complete by: {results.timeWithPass.completionDate})
                  </span>
                )}
              </div>
              {/* Double XP option - only show after Double XP starts */}
              {results.doubleXpResults?.withPass &&
                new Date() >=
                  new Date(results.importantDates.doubleXpStart) && (
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {results.doubleXpResults.withPass.achievable ? (
                        <FaCheck className="text-green-400" />
                      ) : (
                        <FaTimes className="text-red-400" />
                      )}
                    </span>
                    <span className="text-primary-text">
                      With Double XP:{" "}
                      {results.doubleXpResults.withPass.achievable
                        ? "Achievable (faster completion)"
                        : "Still not achievable"}
                    </span>
                    {results.doubleXpResults.withPass.achievable && (
                      <span className="text-sm text-green-400">
                        (
                        {Math.ceil(
                          (new Date(
                            results.doubleXpResults.withPass.completionDate,
                          ).getTime() -
                            Date.now()) /
                            (1000 * 60 * 60 * 24),
                        )}{" "}
                        {Math.ceil(
                          (new Date(
                            results.doubleXpResults.withPass.completionDate,
                          ).getTime() -
                            Date.now()) /
                            (1000 * 60 * 60 * 24),
                        ) === 1
                          ? "day"
                          : "days"}{" "}
                        - Complete by:{" "}
                        {results.doubleXpResults.withPass.completionDate})
                      </span>
                    )}
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Important Dates */}
      <div className="border-stroke bg-secondary-bg rounded-lg border p-6">
        <h3 className="text-primary-text mb-4 text-xl font-semibold">
          Important Season Dates
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="border-stroke bg-primary-bg rounded-lg border p-4">
            <div className="text-center">
              <div className="text-primary-text text-lg font-semibold">
                Double XP Starts
              </div>
              <div className="text-primary-text text-2xl font-bold">
                {results.importantDates.doubleXpStart}
              </div>
              <div className="text-secondary-text mt-1 text-sm">
                Start maximizing your XP gains!
              </div>
            </div>
          </div>
          <div className="border-stroke bg-primary-bg rounded-lg border p-4">
            <div className="text-center">
              <div className="text-primary-text text-lg font-semibold">
                Season Ends
              </div>
              <div className="text-primary-text text-2xl font-bold">
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
