import type { SupporterLevel } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { SupporterTierRow } from "./SupporterTierRow";

interface SupporterLevelRowProps {
  level: SupporterLevel;
  buttonLabel: string;
  onBuy: () => void;
}

/** A tier to buy in the purchase dialog, laid out like the settings' tiers. */
export default function SupporterLevelRow({
  level,
  buttonLabel,
  onBuy,
}: SupporterLevelRowProps) {
  return (
    <SupporterTierRow
      level={level.level}
      name={level.name}
      detail={`$${level.price_str}`}
      actions={
        <Button type="button" size="sm" onClick={onBuy}>
          {buttonLabel}
        </Button>
      }
    />
  );
}
