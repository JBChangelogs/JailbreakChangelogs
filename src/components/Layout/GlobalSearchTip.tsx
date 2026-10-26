"use client";

import { useEffect, useId, useState } from "react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { safeLocalStorage } from "@/utils/storage/safeStorage";

const SEEN_KEY = "jbcl:global-search-tip-seen";

export default function GlobalSearchTip({
  children,
  searchOpen,
  onOpenSearch,
}: {
  children: React.ReactElement;
  searchOpen: boolean;
  onOpenSearch: () => void;
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (searchOpen) {
      safeLocalStorage.setItem(SEEN_KEY, "true");
      setOpen(false);
    } else {
      setOpen(safeLocalStorage.getItem(SEEN_KEY) !== "true");
    }
  }, [searchOpen]);

  const dismiss = () => {
    safeLocalStorage.setItem(SEEN_KEY, "true");
    setOpen(false);
  };

  return (
    <Popover
      open={open && !searchOpen}
      onOpenChange={(next) => !next && dismiss()}
    >
      <PopoverPrimitive.Anchor asChild>{children}</PopoverPrimitive.Anchor>
      <PopoverContent
        side="bottom"
        sideOffset={12}
        collisionPadding={16}
        className="bg-secondary-bg w-80 p-4"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <p id={titleId} className="font-semibold">
          Meet your new search
        </p>
        <p id={descriptionId} className="text-secondary-text mt-1 text-sm">
          Jump straight to what you’re looking for.
        </p>
        <div className="mt-4 flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => {
              dismiss();
              onOpenSearch();
            }}
          >
            Try search
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
