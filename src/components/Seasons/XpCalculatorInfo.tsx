export default function XpCalculatorInfo() {
  return (
    <div className="mb-6 rounded-lg border border-[#2E3944] bg-[#212A31] p-4">
      <h3 className="mb-3 text-lg font-semibold text-[#FFFFFF]">💡 How This Calculator Works</h3>
      <div className="space-y-2 text-sm text-muted">
        <p>• <strong>Current Level:</strong> Your current season level (1-9)</p>
        <p>• <strong>Current XP:</strong> XP progress within your current level</p>
        <p>• <strong>Season Pass:</strong> Whether you have the premium season pass</p>
        <p>• <strong>Target Level:</strong> The level you want to reach (usually level 10)</p>
        <p>• <strong>Double XP:</strong> Special periods with 2x XP gains</p>
      </div>
      <div className="mt-3 text-xs text-muted">
        <p><strong>Tip:</strong> The calculator considers daily XP limits, contract rewards, and season timing to give you the most accurate estimate.</p>
      </div>
    </div>
  );
} 