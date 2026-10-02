import { Button } from "@/components/ui/button";

interface PricingTierActionProps {
  tierNumber: number;
  supporterLevel: number;
  isRoblox: boolean;
  isLoading: boolean;
  isUnavailable?: boolean;
  onSupport: () => void;
}

export default function PricingTierAction({
  tierNumber,
  supporterLevel,
  isRoblox,
  isLoading,
  isUnavailable = false,
  onSupport,
}: PricingTierActionProps) {
  const isFree = tierNumber === 0;
  const isCurrentTier = !isFree && tierNumber === supporterLevel;

  return (
    <div className="mt-auto pt-6">
      {!isFree && tierNumber > supporterLevel ? (
        <Button
          onClick={onSupport}
          disabled={isUnavailable || (!isRoblox && isLoading)}
          className="w-full tracking-wide capitalize"
        >
          {isRoblox
            ? "Support with Robux"
            : isLoading
              ? "Loading..."
              : isUnavailable
                ? "Unavailable"
                : "Support with Discord"}
        </Button>
      ) : (
        <div
          className={`text-primary-text w-full rounded-md border px-4 py-2 text-center font-medium tracking-wide capitalize ${
            isCurrentTier
              ? "border-button-info/40 bg-button-info/10"
              : "border-border-card bg-tertiary-bg"
          }`}
        >
          {isFree
            ? "Already included"
            : isCurrentTier
              ? "Current tier"
              : "Included in your plan"}
        </div>
      )}
    </div>
  );
}
