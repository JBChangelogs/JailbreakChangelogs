import { DoubleXpResult } from "@/types/seasons";

interface XpDoubleXpAnalysisProps {
  doubleXpResults: {
    noPass: DoubleXpResult;
    withPass: DoubleXpResult;
  };
}

export default function XpDoubleXpAnalysis({
  doubleXpResults,
}: XpDoubleXpAnalysisProps) {
  return (
    <div className="border-stroke bg-secondary-bg rounded-lg border p-4">
      <h3 className="text-primary-text mb-3 text-xl font-semibold">
        🔄 Double XP Analysis
      </h3>
      <div className="space-y-3">
        <div className="flex items-center">
          <span
            className={`mr-2 text-lg ${doubleXpResults.noPass.achievable ? "text-button-success" : "text-button-danger"}`}
          >
            {doubleXpResults.noPass.achievable ? "✅" : "❌"}
          </span>
          <span className="text-primary-text">
            Without Season Pass:{" "}
            {doubleXpResults.noPass.achievable ? (
              "Achievable using Double XP boost"
            ) : (
              <>
                <span className="text-button-danger">Not achievable</span> even
                with Double XP
              </>
            )}
          </span>
        </div>
        {doubleXpResults.noPass.achievable && (
          <div className="text-secondary-text ml-6">
            Faster completion with Double XP:{" "}
            {doubleXpResults.noPass.completionDate}
          </div>
        )}
        <div className="flex items-center">
          <span
            className={`mr-2 text-lg ${doubleXpResults.withPass.achievable ? "text-button-success" : "text-button-danger"}`}
          >
            {doubleXpResults.withPass.achievable ? "✅" : "❌"}
          </span>
          <span className="text-primary-text">
            With Season Pass:{" "}
            {doubleXpResults.withPass.achievable ? (
              "Achievable using Double XP boost"
            ) : (
              <>
                <span className="text-button-danger">Not achievable</span> even
                with Double XP
              </>
            )}
          </span>
        </div>
        {doubleXpResults.withPass.achievable && (
          <div className="text-secondary-text ml-6">
            Faster completion with Double XP:{" "}
            {doubleXpResults.withPass.completionDate}
          </div>
        )}
      </div>
    </div>
  );
}
