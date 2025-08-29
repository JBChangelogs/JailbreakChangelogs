import { DoubleXpResult } from '@/types/seasons';

interface XpDoubleXpAnalysisProps {
  doubleXpResults: {
    noPass: DoubleXpResult;
    withPass: DoubleXpResult;
  };
}

export default function XpDoubleXpAnalysis({ doubleXpResults }: XpDoubleXpAnalysisProps) {
  return (
    <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-4">
      <h3 className="mb-3 text-xl font-semibold text-muted">🔄 Double XP Analysis</h3>
      <div className="space-y-3">
        <div className="flex items-center">
          <span className={`mr-2 text-lg ${doubleXpResults.noPass.achievable ? 'text-green-400' : 'text-red-400'}`}>
            {doubleXpResults.noPass.achievable ? '✅' : '❌'}
          </span>
          <span className="text-[#FFFFFF]">
            Without Season Pass: {doubleXpResults.noPass.achievable ? 'Achievable using Double XP boost' : 'Not achievable even with Double XP'}
          </span>
        </div>
        {doubleXpResults.noPass.achievable && (
          <div className="ml-6 text-green-400">
            Faster completion with Double XP: {doubleXpResults.noPass.completionDate}
          </div>
        )}
        <div className="flex items-center">
          <span className={`mr-2 text-lg ${doubleXpResults.withPass.achievable ? 'text-green-400' : 'text-red-400'}`}>
            {doubleXpResults.withPass.achievable ? '✅' : '❌'}
          </span>
          <span className="text-[#FFFFFF]">
            With Season Pass: {doubleXpResults.withPass.achievable ? 'Achievable using Double XP boost' : 'Not achievable even with Double XP'}
          </span>
        </div>
        {doubleXpResults.withPass.achievable && (
          <div className="ml-6 text-green-400">
            Faster completion with Double XP: {doubleXpResults.withPass.completionDate}
          </div>
        )}
      </div>
    </div>
  );
} 