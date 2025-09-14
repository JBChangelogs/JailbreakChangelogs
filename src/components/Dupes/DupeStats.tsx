"use client";

interface DupeStatsData {
  total_duplicates: number;
  total_duplicates_str: string;
}

interface DupeStatsProps {
  statsData: DupeStatsData;
}

export default function DupeStats({ statsData }: DupeStatsProps) {
  return (
    <div className="mb-6 flex justify-center pt-6">
      <div className="w-full max-w-sm rounded-lg border border-[#2E3944] bg-[#212A31] p-4 text-center shadow-sm">
        <div className="text-2xl font-bold text-[#ef4444]">
          {statsData.total_duplicates_str}
        </div>
        <div className="text-sm text-gray-400">Total Duplicates</div>
      </div>
    </div>
  );
}
