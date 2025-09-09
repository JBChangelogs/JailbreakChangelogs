import { CalculationResults } from "@/types/seasons";
import { FaCheck, FaTimes } from "react-icons/fa";
import { BsCalendar2Date } from "react-icons/bs";

interface XpResultsSummaryProps {
  results: CalculationResults;
}

export default function XpResultsSummary({ results }: XpResultsSummaryProps) {
  const getStatusIcon = (achievable: boolean) =>
    achievable ? (
      <FaCheck className="text-green-400" />
    ) : (
      <FaTimes className="text-red-400" />
    );

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
      <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-6">
        <h3
          id="season-progress-summary"
          className="mb-4 text-2xl font-bold text-[#FFFFFF]"
        >
          🎯 Your Season Progress Summary
        </h3>

        {/* Recommendation */}
        <div
          className={`mb-6 rounded-lg p-4 ${
            recommendation.type === "success"
              ? "border border-green-500/30 bg-green-900/20"
              : recommendation.type === "warning"
                ? "border border-yellow-500/30 bg-yellow-900/20"
                : recommendation.type === "info"
                  ? "border border-blue-500/30 bg-blue-900/20"
                  : "border border-red-500/30 bg-red-900/20"
          }`}
        >
          <div className="mb-2 text-lg font-semibold text-[#FFFFFF]">
            {recommendation.message}
          </div>
          <div className="text-muted mb-3">{recommendation.details}</div>
        </div>

        {/* Progress Overview */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#FFFFFF]">
              {results.currentLevel}
            </div>
            <div className="text-muted text-sm">Current Level</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#FFFFFF]">
              {results.currentXp.toLocaleString()}
            </div>
            <div className="text-muted text-sm">Total XP</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#FFFFFF]">
              {results.xpNeeded.toLocaleString()}
            </div>
            <div className="text-muted text-sm">XP Needed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#FFFFFF]">
              {results.requiredXp.toLocaleString()}
            </div>
            <div className="text-muted text-sm">Target XP</div>
          </div>
        </div>

        {/* Time Estimates */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg bg-[#2E3944] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-semibold text-[#FFFFFF]">
                ⏱️ Without Season Pass
              </h4>
              <span className="text-lg">
                {getStatusIcon(results.achievableNoPass)}
              </span>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#FFFFFF]">
                {results.timeNoPass.days}
              </div>
              <div className="text-muted text-sm">days</div>
              {results.achievableNoPass ? (
                <div className="text-muted mt-1 text-xs">
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

          <div className="rounded-lg bg-[#2E3944] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-semibold text-[#FFFFFF]">
                🚀 With Season Pass
              </h4>
              <span className="text-lg">
                {getStatusIcon(results.achievableWithPass)}
              </span>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#FFFFFF]">
                {results.timeWithPass.days}
              </div>
              <div className="text-muted text-sm">days</div>
              {results.achievableWithPass ? (
                <div className="text-muted mt-1 text-xs">
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

      {/* Double XP Analysis */}
      {results.doubleXpResults && (
        <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-6">
          <h3 className="mb-4 text-xl font-semibold text-[#FFFFFF]">
            🔄 Double XP Analysis
          </h3>

          {/* Without Game Pass Double XP Check */}
          <div className="mb-6">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-lg">
                {results.achievableNoPass ? (
                  <FaCheck className="text-green-400" />
                ) : (
                  <FaTimes className="text-red-400" />
                )}
              </span>
              <span className="text-[#FFFFFF]">
                Without Season Pass:{" "}
                {results.achievableNoPass
                  ? "Achievable with normal XP"
                  : "Not achievable with normal XP"}
              </span>
            </div>
            {!results.achievableNoPass && results.doubleXpResults?.noPass && (
              <div className="ml-6 rounded-lg bg-[#2E3944] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[#FFFFFF]">
                    Without Season Pass + Double XP:
                  </span>
                  <span className="text-lg">
                    {results.doubleXpResults.noPass &&
                      getStatusIcon(results.doubleXpResults.noPass.achievable)}
                  </span>
                </div>
                {results.doubleXpResults.noPass &&
                results.doubleXpResults.noPass.achievable ? (
                  <div className="mt-2 text-center">
                    <div className="font-medium text-green-400">
                      Achievable with Double XP
                    </div>
                    <div className="text-muted mt-1 text-sm">
                      Complete by:{" "}
                      {results.doubleXpResults.noPass.completionDate}
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 text-center text-red-400">
                    Not achievable even with Double XP
                  </div>
                )}
              </div>
            )}
          </div>

          {/* With Game Pass Double XP Check */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="text-lg">
                {results.achievableWithPass ? (
                  <FaCheck className="text-green-400" />
                ) : (
                  <FaTimes className="text-red-400" />
                )}
              </span>
              <span className="text-[#FFFFFF]">
                With Season Pass:{" "}
                {results.achievableWithPass
                  ? "Achievable with normal XP"
                  : "Not achievable with normal XP"}
              </span>
            </div>
            {!results.achievableWithPass &&
              results.doubleXpResults?.withPass && (
                <div className="ml-6 rounded-lg bg-[#2E3944] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[#FFFFFF]">
                      With Season Pass + Double XP:
                    </span>
                    <span className="text-lg">
                      {results.doubleXpResults.withPass &&
                        getStatusIcon(
                          results.doubleXpResults.withPass.achievable,
                        )}
                    </span>
                  </div>
                  {results.doubleXpResults.withPass &&
                  results.doubleXpResults.withPass.achievable ? (
                    <div className="mt-2 text-center">
                      <div className="font-medium text-green-400">
                        Achievable with Double XP
                      </div>
                      <div className="text-muted mt-1 text-sm">
                        Complete by:{" "}
                        {results.doubleXpResults.withPass.completionDate}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 text-center text-red-400">
                      Not achievable even with Double XP
                    </div>
                  )}
                </div>
              )}
          </div>
        </div>
      )}

      {/* Important Dates */}
      <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-6">
        <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-[#FFFFFF]">
          <BsCalendar2Date className="text-blue-400" />
          Important Season Dates
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg bg-[#2E3944] p-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-[#FFFFFF]">
                Double XP Starts
              </div>
              <div className="text-2xl font-bold text-yellow-400">
                {results.importantDates.doubleXpStart}
              </div>
              <div className="text-muted mt-1 text-sm">
                Start maximizing your XP gains!
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-[#2E3944] p-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-[#FFFFFF]">
                Season Ends
              </div>
              <div className="text-2xl font-bold text-red-400">
                {results.importantDates.seasonEnds}
              </div>
              <div className="text-muted mt-1 text-sm">
                Final deadline to reach your goal
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
