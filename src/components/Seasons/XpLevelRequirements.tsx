"use client";

import { Season } from '@/types/seasons';

interface XpLevelRequirementsProps {
  season: Season;
}

export default function XpLevelRequirements({ season }: XpLevelRequirementsProps) {
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
  const totalPossibleExp = constants.EFFICIENCY * (
    constants.AVG_EXP_PER_CONTRACT * constants.CONTRACTS_PER_DAY * constants.TOTAL_DAYS +
    constants.MAX_DAILY_EXP * constants.TOTAL_DAYS
  );

  function getExpFromLevel(targetLevel: number) {
    if (targetLevel <= 0) return 0;
    
    const curveK = constants.CURVE_K;
    let result;

    if (curveK === 1) {
      result = totalPossibleExp / (xpData.targetLevel - 1);
    } else {
      result = (totalPossibleExp * (1 - curveK)) / (1 - Math.pow(curveK, xpData.targetLevel - 1));
    }

    let calculatedExp;
    if (curveK === 1) {
      calculatedExp = result * (targetLevel - 1);
    } else {
      calculatedExp = (result * (1 - Math.pow(curveK, targetLevel - 1))) / (1 - curveK);
    }

    let roundedExp = Math.floor(calculatedExp);
    if (0.5 <= calculatedExp - roundedExp) {
      roundedExp += 1;
    }
    return roundedExp;
  }

  const levelRequirements = [];
  for (let i = 2; i <= xpData.targetLevel; i++) {
    const totalXpForLevel = getExpFromLevel(i);
    const totalXpForPreviousLevel = getExpFromLevel(i - 1);
    const xpRequiredForLevel = totalXpForLevel - totalXpForPreviousLevel;
    
    levelRequirements.push({
      level: i,
      totalXp: totalXpForLevel,
      xpRequired: xpRequiredForLevel
    });
  }

  const maxTotalXp = levelRequirements[levelRequirements.length - 1].totalXp;

  return (
    <div className="mb-8 rounded-lg border border-[#2E3944] bg-[#212A31] p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-[#5865F2] to-[#4752C4] rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">
            XP Requirements by Level
          </h2>
          <p className="text-gray-300">
            Season {season.season} progression guide
          </p>
        </div>
      </div>
      
      {/* Overall Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-300">Season Progress</span>
          <span className="text-sm text-white font-medium">
            {maxTotalXp.toLocaleString()} XP Total
          </span>
        </div>
        <div className="w-full bg-[#1E2328] rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-[#5865F2] to-[#4752C4] h-3 rounded-full transition-all duration-500"
            style={{ width: '100%' }}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {levelRequirements.map((req) => {
          const progressPercentage = (req.totalXp / maxTotalXp) * 100;
          const isTarget = req.level === xpData.targetLevel;
          
          return (
            <div 
              key={req.level}
              className={`relative group bg-gradient-to-br from-[#2E3944] to-[#37424D] rounded-xl p-6 border transition-all duration-300 hover:shadow-lg ${
                isTarget 
                  ? 'border-[#5865F2] shadow-[0_0_20px_rgba(88,101,242,0.3)]' 
                  : 'border-[#37424D] hover:border-[#5865F2]'
              }`}
            >
                             {/* Level Header */}
               <div className="flex items-center justify-between mb-4">
                 <span className="text-lg font-semibold text-white">
                   Level {req.level}
                 </span>
                 {isTarget && (
                   <span className="bg-[#5865F2] text-white text-xs px-2 py-1 rounded-full font-medium">
                     Target
                   </span>
                 )}
               </div>

              {/* Progress Bar for this level */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-400">Progress</span>
                  <span className="text-xs text-white font-medium">
                    {progressPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-[#1E2328] rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-[#5865F2] to-[#4752C4] h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* XP Information */}
              <div className="space-y-3">
                {/* This Level Section */}
                <div className="bg-[#1E2328]/50 rounded-lg p-3 border border-[#2E3944]">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-[#5865F2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-xs font-medium text-[#5865F2] uppercase tracking-wide">This Level Only</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">XP Required:</span>
                    <span className="text-lg text-white font-bold">
                      {req.xpRequired.toLocaleString()} XP
                    </span>
                  </div>
                </div>

                {/* Total Needed Section */}
                <div className="bg-[#2E3944]/50 rounded-lg p-3 border border-[#37424D]">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-[#FFB636]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="text-xs font-medium text-[#FFB636] uppercase tracking-wide">Cumulative Total</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Total XP:</span>
                    <span className="text-lg text-white font-bold">
                      {req.totalXp.toLocaleString()} XP
                    </span>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-[#5865F2]/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
