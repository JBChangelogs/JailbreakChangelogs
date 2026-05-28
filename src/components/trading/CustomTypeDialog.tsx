"use client";

import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getTradeItemImagePath } from "@/utils/trading/tradeItems";
import { handleImageError } from "@/utils/ui/images";

type TradeSide = "offering" | "requesting";

interface CustomTypeOption {
  id: string;
  label: string;
}

const CUSTOM_TYPE_DESCRIPTIONS: Record<string, string> = {
  adds: "Extra items added to sweeten the trade.",
  overpays: "Offering more value than the other side.",
  upgrades: "Giving multiple lower items for one higher item.",
  downgrades: "Giving one higher item for multiple lower items.",
  collectors: "Specifically for collectors / rare variants.",
  rares: "Rare items or hard-to-find pieces.",
  demands: "High-demand items (demand-focused).",
  "og owners": "Those looking for their OG items.",
};

interface CustomTypeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customType: CustomTypeOption | null;
  onSelect: (side: TradeSide) => void;
  selectedOnOffering: boolean;
  selectedOnRequesting: boolean;
}

export function CustomTypeDialog({
  isOpen,
  onClose,
  customType,
  onSelect,
  selectedOnOffering,
  selectedOnRequesting,
}: CustomTypeDialogProps) {
  if (!customType) return null;

  const description =
    CUSTOM_TYPE_DESCRIPTIONS[customType.id] ??
    "A custom trade tag used to describe your offer.";

  const handleSelect = (side: TradeSide) => {
    onSelect(side);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showClose
        aria-describedby={undefined}
        className="bg-secondary-bg max-w-[480px] rounded-lg p-0 backdrop-blur-none"
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-primary-text text-xl font-semibold">
            Add Custom Tag
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-6 pt-4">
          <div className="flex items-center gap-4">
            <div className="relative h-32 w-32 shrink-0">
              <Image
                src={getTradeItemImagePath({
                  id: customType.id,
                  instanceId: customType.id,
                  type: "Custom",
                  name: customType.label,
                })}
                alt={customType.label}
                fill
                className="object-contain"
                onError={handleImageError}
              />
            </div>
            <div>
              <p className="text-primary-text font-semibold">
                {customType.label}
              </p>
              <p className="text-secondary-text mt-1 text-sm">{description}</p>
            </div>
          </div>

          <div>
            <p className="text-secondary-text mb-2 text-xs tracking-wider uppercase">
              Which side?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="success"
                onClick={() => handleSelect("offering")}
                disabled={selectedOnOffering}
                className="w-full"
              >
                Offering
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleSelect("requesting")}
                disabled={selectedOnRequesting}
                className="w-full"
              >
                Requesting
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4 gap-2 px-6 pt-2 pb-6">
          <DialogClose asChild>
            <Button variant="ghost" size="sm">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
