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

export default function XpTimeResults({ timeNoPass, timeWithPass }: XpTimeResultsProps) {
  return (
    <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-4">
      <h3 className="mb-3 text-xl font-semibold text-muted">⏱️ Time to Complete (Normal XP Rate)</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded bg-[#2E3944] p-3 text-center">
          <div className="mb-1 text-sm text-muted">Without Season Pass</div>
          <div className="text-lg font-medium text-[#FFFFFF]">{timeNoPass.days} days</div>
          <div className="text-sm text-muted">{timeNoPass.completionDate}</div>
        </div>
        <div className="rounded bg-[#2E3944] p-3 text-center">
          <div className="mb-1 text-sm text-muted">With Season Pass</div>
          <div className="text-lg font-medium text-[#FFFFFF]">{timeWithPass.days} days</div>
          <div className="text-sm text-muted">{timeWithPass.completionDate}</div>
        </div>
      </div>
    </div>
  );
} 