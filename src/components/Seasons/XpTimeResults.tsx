interface XpTimeResultsProps {
  timeNoPass: {
    days: number;
    completionDate: string;
  };
  timeWithPass: {
    days: number;
    completionDate: string;
  };
}

export default function XpTimeResults({
  timeNoPass,
  timeWithPass,
}: XpTimeResultsProps) {
  return (
    <div className="border-border-primary hover:border-border-focus bg-secondary-bg rounded-lg border p-4">
      <h3 className="text-muted mb-3 text-xl font-semibold">
        ⏱️ Time to Complete (Normal XP Rate)
      </h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded p-3 text-center">
          <div className="text-muted mb-1 text-sm">Without Season Pass</div>
          <div className="text-primary-text text-lg font-medium">
            {timeNoPass.days} {timeNoPass.days === 1 ? "day" : "days"}
          </div>
          <div className="text-muted text-sm">{timeNoPass.completionDate}</div>
          <div className="mt-1 text-xs text-gray-500">
            Results may vary (±1 day)
          </div>
        </div>
        <div className="rounded p-3 text-center">
          <div className="text-muted mb-1 text-sm">With Season Pass</div>
          <div className="text-primary-text text-lg font-medium">
            {timeWithPass.days} {timeWithPass.days === 1 ? "day" : "days"}
          </div>
          <div className="text-muted text-sm">
            {timeWithPass.completionDate}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Results may vary (±1 day)
          </div>
        </div>
      </div>
    </div>
  );
}
