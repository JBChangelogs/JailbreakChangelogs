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
  xpNeeded,
}: XpProgressResultsProps) {
  return (
    <div className="border-stroke bg-secondary-bg rounded-lg border p-4">
      <h3 className="text-muted mb-3 text-xl font-semibold">
        📊 Current Progress
      </h3>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="text-center">
          <div className="text-muted mb-1 text-sm">Current Level</div>
          <div className="text-primary-text font-medium">{currentLevel}</div>
        </div>
        <div className="text-center">
          <div className="text-muted mb-1 text-sm">Current XP</div>
          <div className="text-primary-text font-medium">
            {currentXp.toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="text-muted mb-1 text-sm">Required XP</div>
          <div className="text-primary-text font-medium">
            {requiredXp.toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="text-muted mb-1 text-sm">XP Needed</div>
          <div className="text-primary-text font-medium">
            {xpNeeded.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
