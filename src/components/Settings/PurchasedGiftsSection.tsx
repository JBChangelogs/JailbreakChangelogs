import Image from "next/image";
import type { SupporterGift } from "@/types/auth";
import { Button as CustomButton } from "@/components/ui/button";

const BADGE_BASE_URL =
  "https://assets.jailbreakchangelogs.com/assets/website_icons";
const supporterIcons: Record<number, string> = {
  1: `${BADGE_BASE_URL}/jbcl_supporter_1.svg`,
  2: `${BADGE_BASE_URL}/jbcl_supporter_2.svg`,
  3: `${BADGE_BASE_URL}/jbcl_supporter_3.svg`,
};

interface PurchasedGiftsSectionProps {
  gifts: SupporterGift[];
  giftingIds: Record<string, boolean>;
  onRedeemForSelf: (shareId: string) => void;
  onOpenGiftModal: (gift: SupporterGift) => void;
  onPurchaseGift: () => void;
}

const getSupporterGiftTierLabel = (level: number) => {
  switch (level) {
    case 1:
      return "Supporter One Gift";
    case 2:
      return "Supporter Two Gift";
    case 3:
      return "Supporter Three Gift";
    default:
      return `Supporter Gift ${level}`;
  }
};

export default function PurchasedGiftsSection({
  gifts,
  giftingIds,
  onRedeemForSelf,
  onOpenGiftModal,
  onPurchaseGift,
}: PurchasedGiftsSectionProps) {
  if (gifts.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-secondary-text text-sm">No gifts purchased yet.</p>
        <div className="flex justify-start">
          <CustomButton type="button" size="sm" onClick={onPurchaseGift}>
            Purchase Gift
          </CustomButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="max-h-[34rem] overflow-y-auto pr-1">
        <div className="flex flex-col gap-3">
          {gifts.map((gift) => (
            <div
              key={gift.id}
              className="bg-tertiary-bg border-border-card rounded-lg border p-4"
            >
              <div className="flex flex-col gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-primary-text text-sm font-semibold">
                      {getSupporterGiftTierLabel(gift.level)}
                    </p>
                    {supporterIcons[gift.level] && (
                      <Image
                        src={supporterIcons[gift.level]}
                        alt={getSupporterGiftTierLabel(gift.level)}
                        width={18}
                        height={18}
                        className="object-contain"
                      />
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <CustomButton
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => onRedeemForSelf(gift.share_id)}
                    disabled={!!giftingIds[gift.share_id]}
                  >
                    {giftingIds[gift.share_id]
                      ? "Processing..."
                      : "Self Redeem"}
                  </CustomButton>
                  <CustomButton
                    type="button"
                    size="sm"
                    onClick={() => onOpenGiftModal(gift)}
                    disabled={!!giftingIds[gift.share_id]}
                  >
                    {giftingIds[gift.share_id]
                      ? "Processing..."
                      : "Gift to User"}
                  </CustomButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-start">
        <CustomButton type="button" size="sm" onClick={onPurchaseGift}>
          Purchase Gift
        </CustomButton>
      </div>
    </div>
  );
}
