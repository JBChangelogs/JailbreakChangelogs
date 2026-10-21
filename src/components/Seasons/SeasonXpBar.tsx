interface SeasonXpBarProps {
  percent: number;
  xpLabel: string;
  level: number;
  season: number;
  mobileSecondaryText?: string;
  bgStyle?: "primary" | "secondary" | "tertiary" | "quaternary";
}

export default function SeasonXpBar({
  percent,
  xpLabel,
  level,
  season,
  mobileSecondaryText = `SEASON ${season}`,
  bgStyle = "primary",
}: SeasonXpBarProps) {
  const labels = (
    <>
      <div className="absolute inset-0 flex flex-col justify-center px-2 sm:hidden">
        <div className="text-xs leading-tight font-bold">
          <div className="text-center">{`LEVEL ${level}`}</div>
          <div className="text-center text-[10px] leading-tight">
            {mobileSecondaryText}
          </div>
        </div>
      </div>
      <div className="hidden sm:block">
        <div className="absolute top-1/2 left-2 -translate-y-1/2">
          <span className="text-sm font-bold">{xpLabel}</span>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <span className="text-sm font-bold">{`LEVEL ${level}`}</span>
        </div>
        <div className="absolute top-1/2 right-2 -translate-y-1/2">
          <span className="text-sm font-bold">{`SEASON ${season}`}</span>
        </div>
      </div>
    </>
  );

  return (
    <div
      className={`inset-ring-button-info relative h-8 w-full overflow-hidden rounded-lg inset-ring-2 ${bgStyle === "secondary" ? "bg-secondary-bg" : bgStyle === "tertiary" ? "bg-tertiary-bg" : bgStyle === "quaternary" ? "bg-quaternary-bg" : "bg-primary-bg"}`}
    >
      <div
        className="bg-button-info absolute top-0 left-0 h-full transition-all duration-500"
        style={{ width: `${percent}%` }}
      />
      <div className="text-primary-text pointer-events-none absolute inset-0 z-10">
        {labels}
      </div>
      {/* Clip contrasting labels to the fill, including text crossing its edge. */}
      <div
        aria-hidden="true"
        className="text-form-button-text pointer-events-none absolute inset-0 z-20 transition-all duration-500"
        style={{
          clipPath: `inset(0 ${100 - percent}% 0 0)`,
          WebkitClipPath: `inset(0 ${100 - percent}% 0 0)`,
        }}
      >
        {labels}
      </div>
    </div>
  );
}
