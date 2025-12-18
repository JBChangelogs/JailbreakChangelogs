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
    <div className="border-border-primary bg-secondary-bg hover:border-border-focus mb-8 rounded-lg border p-6">
      <h2 className="text-muted mb-4 text-2xl font-semibold">
        Season Information
      </h2>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-5">
        <div className="text-center">
          <div className="text-muted mb-1 text-sm">Season</div>
          <div className="text-primary-text text-lg font-semibold">
            {season}
          </div>
        </div>
        <div className="text-center">
          <div className="text-muted mb-1 text-sm">Title</div>
          <div className="text-primary-text text-sm font-medium">{title}</div>
        </div>
        <div className="text-center">
          <div className="text-muted mb-1 text-sm">Target Level</div>
          <div className="text-primary-text text-lg font-semibold">
            {targetLevel}
          </div>
        </div>
        <div className="text-center">
          <div className="text-muted mb-1 text-sm">Total Days</div>
          <div className="text-primary-text text-lg font-semibold">
            {totalDays}
          </div>
        </div>
        <div className="text-center">
          <div className="text-muted mb-1 text-sm">Season Ends</div>
          <div className="text-primary-text text-sm font-medium">
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
