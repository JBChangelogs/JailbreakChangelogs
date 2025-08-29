import { useState, useEffect } from 'react';
import ImageModal from '@/components/UI/ImageModal';
import dynamic from 'next/dynamic';
import { Season } from '@/types/seasons';

const Select = dynamic(() => import('react-select'), { ssr: false });

interface XpCalculatorFormProps {
  currentLevel: number;
  currentXp: number;
  targetLevel: number;
  onLevelChange: (level: number) => void;
  onXpChange: (xp: number) => void;
  onCalculate: () => void;
  isCalculating?: boolean;
  season: Season; // Add season prop to access XP data
}

export default function XpCalculatorForm({
  currentLevel,
  currentXp,
  targetLevel,
  onLevelChange,
  onXpChange,
  onCalculate,
  isCalculating = false,
  season
}: XpCalculatorFormProps) {
  const [selectLoaded, setSelectLoaded] = useState(false);

  // Set selectLoaded to true after mount to ensure client-side rendering
  useEffect(() => {
    setSelectLoaded(true);
  }, []);

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
    const totalPossibleExp = constants.EFFICIENCY * (
      constants.AVG_EXP_PER_CONTRACT * constants.CONTRACTS_PER_DAY * constants.TOTAL_DAYS +
      constants.MAX_DAILY_EXP * constants.TOTAL_DAYS
    );

    // Function to get XP required for a level
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

    // Get total XP for next level and current level
    const totalXpForNextLevel = getExpFromLevel(level + 1);
    const totalXpForCurrentLevel = getExpFromLevel(level);
    
    // Return the XP required to reach the next level
    return totalXpForNextLevel - totalXpForCurrentLevel;
  };

  const maxXpForCurrentLevel = getMaxXpForLevel(currentLevel);
  return (
    <div className="mb-8 rounded-lg border border-[#2E3944] bg-[#212A31] p-6">
      <h2 className="mb-6 text-2xl font-semibold text-[#FFFFFF]">🎯 XP Progress Calculator</h2>
      
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
        <p className="mt-2 text-sm text-muted">
          💡 Use this image as a reference to find your current level and XP progress
        </p>
      </div>
      
      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-[#FFFFFF]">Current Level</label>
          {selectLoaded ? (
            <Select
              value={{ value: currentLevel, label: `Level ${currentLevel}` }}
              onChange={(option: unknown) => {
                if (!option) {
                  onLevelChange(1);
                  return;
                }
                const newLevel = (option as { value: number }).value;
                onLevelChange(newLevel);
              }}
              options={Array.from({ length: targetLevel - 1 }, (_, i) => ({
                value: i + 1,
                label: `Level ${i + 1}`
              }))}
              classNamePrefix="react-select"
              className="w-full"
              isClearable={false}
              isSearchable={false}
              styles={{
                control: (base) => ({
                  ...base,
                  backgroundColor: '#2E3944',
                  borderColor: '#2E3944',
                  color: '#FFFFFF',
                  '&:hover': {
                    borderColor: '#124E66',
                  },
                  '&:focus-within': {
                    borderColor: '#124E66',
                  },
                }),
                singleValue: (base) => ({ ...base, color: '#FFFFFF' }),
                menu: (base) => ({ ...base, backgroundColor: '#37424D', color: '#D3D9D4', zIndex: 3000 }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isSelected ? '#5865F2' : state.isFocused ? '#2E3944' : '#37424D',
                  color: state.isSelected || state.isFocused ? '#FFFFFF' : '#D3D9D4',
                  '&:active': {
                    backgroundColor: '#124E66',
                    color: '#FFFFFF',
                  },
                }),
              }}
            />
          ) : (
            <div className="w-full h-10 bg-[#2E3944] border border-[#2E3944] rounded-md animate-pulse"></div>
          )}
          <div className="mt-1 text-xs text-muted">
            Select your current level (1-{targetLevel - 1})
          </div>
        </div>
        
        <div>
          <label className="mb-2 block text-sm font-medium text-[#FFFFFF]">XP in Current Level</label>
          <input
            type="number"
            min="0"
            max={maxXpForCurrentLevel}
            value={currentXp}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 0;
              // Clamp the value to the max XP for the current level
              const clampedValue = Math.min(value, maxXpForCurrentLevel);
              onXpChange(clampedValue);
            }}
            className="w-full rounded border border-[#2E3944] bg-[#2E3944] px-3 py-2 text-[#FFFFFF] focus:border-[#124E66] focus:outline-none"
            placeholder={`0-${maxXpForCurrentLevel}`}
          />
          <div className="mt-1 text-xs text-muted">
            XP progress within Level {currentLevel} (0-{maxXpForCurrentLevel.toLocaleString()} XP needed to reach Level {currentLevel + 1})
          </div>
        </div>
      </div>

      <button
        onClick={onCalculate}
        disabled={isCalculating}
        className="w-full rounded-lg bg-[#124E66] px-6 py-3 font-semibold text-[#FFFFFF] transition-colors hover:bg-[#0D3A4A] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isCalculating ? 'Calculating…' : '🚀 Calculate My Progress'}
      </button>
    </div>
  );
} 