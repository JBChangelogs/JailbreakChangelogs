interface SeasonInfoProps {
  season: number;
  title: string;
  targetLevel: number;
  totalDays: number;
  endDate: number;
}

export default function SeasonInfo({
  season,
  title,
  targetLevel,
  totalDays,
  endDate,
}: SeasonInfoProps) {
  return (
    <div className="mb-8 rounded-lg border border-[#2E3944] bg-[#212A31] p-6">
      <h2 className="text-muted mb-4 text-2xl font-semibold">
        Season Information
      </h2>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-5">
        <div className="text-center">
          <div className="text-muted mb-1 text-sm">Season</div>
          <div className="text-lg font-semibold text-[#FFFFFF]">{season}</div>
        </div>
        <div className="text-center">
          <div className="text-muted mb-1 text-sm">Title</div>
          <div className="text-sm font-medium text-[#FFFFFF]">{title}</div>
        </div>
        <div className="text-center">
          <div className="text-muted mb-1 text-sm">Target Level</div>
          <div className="text-lg font-semibold text-[#FFFFFF]">
            {targetLevel}
          </div>
        </div>
        <div className="text-center">
          <div className="text-muted mb-1 text-sm">Total Days</div>
          <div className="text-lg font-semibold text-[#FFFFFF]">
            {totalDays}
          </div>
        </div>
        <div className="text-center">
          <div className="text-muted mb-1 text-sm">Season Ends</div>
          <div className="text-sm font-medium text-[#FFFFFF]">
            {new Date(endDate * 1000).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
