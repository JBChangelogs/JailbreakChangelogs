interface XpProgressResultsProps {
  currentLevel: number;
  currentXp: number;
  requiredXp: number;
  xpNeeded: number;
}

export default function XpProgressResults({
  currentLevel,
  currentXp,
  requiredXp,
  xpNeeded
}: XpProgressResultsProps) {
  return (
    <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-4">
      <h3 className="mb-3 text-xl font-semibold text-muted">📊 Current Progress</h3>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="text-center">
          <div className="mb-1 text-sm text-muted">Current Level</div>
          <div className="font-medium text-[#FFFFFF]">{currentLevel}</div>
        </div>
        <div className="text-center">
          <div className="mb-1 text-sm text-muted">Current XP</div>
          <div className="font-medium text-[#FFFFFF]">{currentXp.toLocaleString()}</div>
        </div>
        <div className="text-center">
          <div className="mb-1 text-sm text-muted">Required XP</div>
          <div className="font-medium text-[#FFFFFF]">{requiredXp.toLocaleString()}</div>
        </div>
        <div className="text-center">
          <div className="mb-1 text-sm text-muted">XP Needed</div>
          <div className="font-medium text-[#FFFFFF]">{xpNeeded.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
} 