"use client";

import { useEffect, useId, useState } from "react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { safeLocalStorage } from "@/utils/storage/safeStorage";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const SEEN_KEY = "jbcl:inventory-history-tip-seen";

export default function InventoryHistoryTip({
  anchorRef,
  datePickerOpen,
  onOpenDatePicker,
  isOwnInventory,
}: {
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  datePickerOpen: boolean;
  onOpenDatePicker: () => void;
  isOwnInventory: boolean;
}) {
  const [open, setOpen] = useState(false);
  const isSmallScreen = useMediaQuery("(max-width: 639px)");
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (datePickerOpen) {
      safeLocalStorage.setItem(SEEN_KEY, "true");
      setOpen(false);
    } else {
      setOpen(safeLocalStorage.getItem(SEEN_KEY) !== "true");
    }
  }, [datePickerOpen]);

  const dismiss = () => {
    safeLocalStorage.setItem(SEEN_KEY, "true");
    setOpen(false);
  };

  return (
    <Popover
      open={open && !datePickerOpen}
      onOpenChange={(next) => !next && dismiss()}
    >
      <PopoverPrimitive.Anchor virtualRef={anchorRef} />
      <PopoverContent
        side={isSmallScreen ? "top" : "bottom"}
        align="end"
        sideOffset={12}
        collisionPadding={16}
        className="bg-secondary-bg w-80 p-4"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <p id={titleId} className="font-semibold">
          {isOwnInventory
            ? "View your past inventories"
            : "View past inventories"}
        </p>
        <p id={descriptionId} className="text-secondary-text mt-1 text-sm">
          {isOwnInventory
            ? "Choose a date to see what you owned."
            : "Choose a date to see what they owned."}{" "}
          Only scans from October 31, 2026 onward are available. Dates unlock at
          midnight UTC. Recent scans may appear under yesterday’s date.
        </p>
        <div className="mt-4 flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => {
              dismiss();
              onOpenDatePicker();
            }}
          >
            Choose a date
          </Button>
          <Button size="sm" variant="secondary" onClick={dismiss}>
            Got it
          </Button>
        </div>
        <PopoverPrimitive.Arrow
          className="fill-border-primary"
          width={11}
          height={5}
        />
      </PopoverContent>
    </Popover>
  );
}
