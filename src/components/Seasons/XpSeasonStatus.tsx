interface XpSeasonStatusProps {
  achievableNoPass: boolean;
  achievableWithPass: boolean;
}

export default function XpSeasonStatus({
  achievableNoPass,
  achievableWithPass,
}: XpSeasonStatusProps) {
  return (
    <div className="border-border-card bg-secondary-bg hover:border-border-focus rounded-lg border p-4">
      <h3 className="text-secondary-text mb-3 text-xl font-semibold">
        📅 Season Status
      </h3>
      <div className="space-y-3">
        <div className="flex items-center">
          <span
            className={`mr-2 text-lg ${achievableNoPass ? "text-button-success" : "text-button-danger"}`}
            aria-label={achievableNoPass ? "Achievable" : "Not achievable"}
          >
            {achievableNoPass ? "✓" : "✗"}
          </span>
          <span className="text-primary-text">
            Without Season Pass:{" "}
            {achievableNoPass ? (
              "Achievable before season ends"
            ) : (
              <>
                <span className="text-button-danger">Not achievable</span> with
                normal XP
              </>
            )}
          </span>
        </div>
        <div className="flex items-center">
          <span
            className={`mr-2 text-lg ${achievableWithPass ? "text-button-success" : "text-button-danger"}`}
            aria-label={achievableWithPass ? "Achievable" : "Not achievable"}
          >
            {achievableWithPass ? "✓" : "✗"}
          </span>
          <span className="text-primary-text">
            With Season Pass:{" "}
            {achievableWithPass ? (
              "Achievable before season ends"
            ) : (
              <>
                <span className="text-button-danger">Not achievable</span> with
                normal XP
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
