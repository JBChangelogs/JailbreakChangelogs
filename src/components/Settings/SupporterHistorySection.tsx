import type { SupporterHistoryEntry } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { formatMonthDayYear } from "@/utils/helpers/timestamp";
import { SupporterTierRow } from "./SupporterTierRow";

interface SupporterHistorySectionProps {
  history: SupporterHistoryEntry[];
  currentLevel: number;
  revertingLevel: number | null;
  onUpdateLevel: (level: number) => void;
  onRemove: () => void;
}

const getSupporterTierLabel = (level: number) => `Supporter Tier ${level}`;

const getSupporterHistoryKey = (entry: SupporterHistoryEntry, index: number) =>
  `${entry.level}-${entry.created_at}-${index}`;

export default function SupporterHistorySection({
  history,
  currentLevel,
  revertingLevel,
  onUpdateLevel,
  onRemove,
}: SupporterHistorySectionProps) {
  return (
    <div className="flex flex-col gap-3">
      {history.map((entry, index) => {
        const isCurrentTier = currentLevel === entry.level;
        const isUpgrade = entry.level > currentLevel;
        return (
          <SupporterTierRow
            key={getSupporterHistoryKey(entry, index)}
            level={entry.level}
            name={getSupporterTierLabel(entry.level)}
            detail={
              entry.created_at
                ? `Added ${formatMonthDayYear(entry.created_at)}`
                : undefined
            }
            actions={
              isCurrentTier ? (
                <span className="bg-button-info/15 text-link inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold">
                  Current
                </span>
              ) : (
                <Button
                  type="button"
                  size="md"
                  variant={isUpgrade ? "default" : "secondary"}
                  onClick={() => onUpdateLevel(entry.level)}
                  disabled={revertingLevel !== null}
                >
                  {revertingLevel === entry.level
                    ? isUpgrade
                      ? "Upgrading..."
                      : "Downgrading..."
                    : isUpgrade
                      ? "Upgrade"
                      : "Downgrade"}
                </Button>
              )
            }
          />
        );
      })}
      {currentLevel > 0 && (
        <SupporterTierRow
          level={0}
          name="Free Tier"
          detail="Remove your current supporter tier."
          actions={
            <Button
              type="button"
              size="md"
              variant="secondary"
              onClick={onRemove}
              disabled={revertingLevel !== null}
            >
              {revertingLevel === 0 ? "Downgrading..." : "Downgrade"}
            </Button>
          }
        />
      )}
    </div>
  );
}
