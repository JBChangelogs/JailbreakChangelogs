import Link from "next/link";
import { getSupporterGiftTierLabel } from "@/utils/auth/supporterAccess";
import type { SupporterGift } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import { formatMonthDayYear } from "@/utils/helpers/timestamp";
import { SETTINGS_LIST } from "./SettingsCard";
import { SettingRow } from "./SettingRow";
import { SupporterTierRow } from "./SupporterTierRow";

interface PurchasedGiftsSectionProps {
  gifts: SupporterGift[];
  giftingIds: Record<string, boolean>;
  onRedeemForSelf: (shareId: string) => void;
  onOpenGiftModal: (gift: SupporterGift) => void;
  onPurchaseGift: () => void;
}

export default function PurchasedGiftsSection({
  gifts,
  giftingIds,
  onRedeemForSelf,
  onOpenGiftModal,
  onPurchaseGift,
}: PurchasedGiftsSectionProps) {
  return (
    <div className={SETTINGS_LIST}>
      <SettingRow
        title="Buy a gift"
        description="Give Supporter to a friend, or keep it to redeem yourself later."
        action={
          <>
            <Button variant="secondary" size="md" asChild>
              <Link href="/supporting" prefetch={false}>
                View benefits
              </Link>
            </Button>
            <Button type="button" size="md" onClick={onPurchaseGift}>
              Purchase Gift
            </Button>
          </>
        }
      />

      {gifts.length === 0 ? (
        <div className="border-border-card flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center">
          <Icon
            icon="material-symbols:redeem-rounded"
            aria-hidden="true"
            className="text-secondary-text size-8"
          />
          <p className="text-primary-text text-sm font-medium">No gifts yet</p>
          <p className="text-secondary-text max-w-sm text-sm">
            Gifts you buy show up here, ready to redeem yourself or send to
            someone.
          </p>
        </div>
      ) : (
        <div className="max-h-[34rem] space-y-3 overflow-y-auto pr-1">
          {gifts.map((gift) => {
            const busy = !!giftingIds[gift.share_id];
            return (
              <SupporterTierRow
                key={gift.id}
                level={gift.level}
                name={getSupporterGiftTierLabel(gift.level)}
                detail={`Bought ${formatMonthDayYear(gift.created_at)}`}
                actions={
                  <>
                    <Button
                      type="button"
                      size="md"
                      variant="secondary"
                      onClick={() => onRedeemForSelf(gift.share_id)}
                      disabled={busy}
                    >
                      {busy ? "Processing..." : "Redeem"}
                    </Button>
                    <Button
                      type="button"
                      size="md"
                      onClick={() => onOpenGiftModal(gift)}
                      disabled={busy}
                    >
                      {busy ? "Processing..." : "Gift to User"}
                    </Button>
                  </>
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
