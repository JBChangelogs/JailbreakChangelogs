import Image from "next/image";
import type { SupporterHistoryEntry } from "@/types/auth";
import { Button as CustomButton } from "@/components/ui/button";

const BADGE_BASE_URL =
  "https://assets.jailbreakchangelogs.com/assets/website_icons";
const supporterIcons: Record<number, string> = {
  1: `${BADGE_BASE_URL}/jbcl_supporter_1.svg`,
  2: `${BADGE_BASE_URL}/jbcl_supporter_2.svg`,
  3: `${BADGE_BASE_URL}/jbcl_supporter_3.svg`,
};

interface SupporterHistorySectionProps {
  history: SupporterHistoryEntry[];
  currentLevel: number;
  revertingLevel: number | null;
  onUpdateLevel: (level: number) => void;
  onRemove: () => void;
}

const getSupporterTierLabel = (level: number) => {
  switch (level) {
    case 1:
      return "Supporter Tier 1";
    case 2:
      return "Supporter Tier 2";
    case 3:
      return "Supporter Tier 3";
    default:
      return `Supporter Tier ${level}`;
  }
};

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
          <div
            key={getSupporterHistoryKey(entry, index)}
            className="bg-tertiary-bg border-border-card rounded-lg border p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  {supporterIcons[entry.level] && (
                    <Image
                      src={supporterIcons[entry.level]}
                      alt={getSupporterTierLabel(entry.level)}
                      width={18}
                      height={18}
                      className="object-contain"
                    />
                  )}
                  <p className="text-primary-text text-sm font-semibold">
                    {getSupporterTierLabel(entry.level)}
                  </p>
                </div>
              </div>
              {!isCurrentTier ? (
                <CustomButton
                  type="button"
                  size="sm"
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
                </CustomButton>
              ) : null}
            </div>
          </div>
        );
      })}
      {currentLevel > 0 && (
        <div className="bg-tertiary-bg border-border-card rounded-lg border p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2">
                <p className="text-primary-text text-sm font-semibold">
                  Free Tier
                </p>
              </div>
              <p className="text-secondary-text text-xs">
                Remove your current supporter tier.
              </p>
            </div>
            <CustomButton
              type="button"
              size="sm"
              onClick={onRemove}
              disabled={revertingLevel !== null}
            >
              {revertingLevel === 0 ? "Downgrading..." : "Downgrade"}
            </CustomButton>
          </div>
        </div>
      )}
    </div>
  );
}
