import Image from "next/image";
import type { SupporterLevel } from "@/types/auth";
import { Button as CustomButton } from "@/components/ui/button";

const BADGE_BASE_URL =
  "https://assets.jailbreakchangelogs.com/assets/website_icons";
const supporterIcons: Record<number, string> = {
  1: `${BADGE_BASE_URL}/jbcl_supporter_1.svg`,
  2: `${BADGE_BASE_URL}/jbcl_supporter_2.svg`,
  3: `${BADGE_BASE_URL}/jbcl_supporter_3.svg`,
};

interface SupporterLevelRowProps {
  level: SupporterLevel;
  buttonLabel: string;
  onBuy: () => void;
}

export default function SupporterLevelRow({
  level,
  buttonLabel,
  onBuy,
}: SupporterLevelRowProps) {
  return (
    <div className="bg-tertiary-bg border-border-card flex items-center justify-between gap-3 rounded-lg border p-4">
      <div className="min-w-0">
        <div className="mb-1 flex items-center gap-2">
          {supporterIcons[level.level] && (
            <Image
              src={supporterIcons[level.level]}
              alt={level.name}
              width={18}
              height={18}
              className="object-contain"
            />
          )}
          <p className="text-primary-text text-sm font-semibold">
            {level.name}
          </p>
        </div>
        <p className="text-secondary-text text-sm">${level.price_str}</p>
      </div>
      <CustomButton type="button" size="sm" onClick={onBuy}>
        {buttonLabel}
      </CustomButton>
    </div>
  );
}
