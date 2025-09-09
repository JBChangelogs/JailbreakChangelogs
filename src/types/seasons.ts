export interface XpData {
  xp_rates: {
    curveK: number;
    totalDays: number;
    efficiency: number;
    maxDailyXp: number;
    contractsPerDay: number;
    avgXpPerContract: number;
    maxDailyXpWithPass: number;
  };
  targetLevel: number;
  doubleXpDuration: number;
}

export interface Season {
  season: number;
  title: string;
  description: string;
  is_current: number;
  start_date: number;
  end_date: number;
  xp_data: XpData;
  rewards: string[];
}

export interface DoubleXpResult {
  achievable: boolean;
  completionDate: string;
}

export interface CalculationResults {
  currentLevel: number;
  currentXp: number;
  requiredXp: number;
  xpNeeded: number;
  timeNoPass: {
    days: number;
    completionDate: string;
  };
  timeWithPass: {
    days: number;
    completionDate: string;
  };
  achievableNoPass: boolean;
  achievableWithPass: boolean;
  doubleXpResults: {
    noPass: DoubleXpResult;
    withPass: DoubleXpResult;
  } | null;
  importantDates: {
    doubleXpStart: string;
    seasonEnds: string;
  };
}
