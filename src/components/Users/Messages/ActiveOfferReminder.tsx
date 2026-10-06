"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { useOfferDetailsBatch } from "@/hooks/useOfferDetailsBatch";
import {
  normalizeOfferItems,
  parseOfferAcceptedMetadata,
} from "@/utils/messages/parsing";
import { formatOfferItemSummary } from "@/utils/messages/formatting";
import type { Message } from "@/utils/messages/types";

export function ActiveOfferReminder({
  messages,
  offerDetails,
  onViewOffer,
}: {
  messages: Message[];
  offerDetails: ReturnType<typeof useOfferDetailsBatch>;
  onViewOffer: (message: Message) => void;
}) {
  const seen = new Set<string>();
  const activeOffers = messages.toReversed().flatMap((message) => {
    const metadata = parseOfferAcceptedMetadata(message.metadata);
    if (!metadata) return [];
    const key = `${metadata.trade}:${metadata.offer}`;
    const offer = offerDetails.map[key];
    if (seen.has(key) || offer?.status !== 1) return [];
    seen.add(key);
    return [{ message, offer }];
  });
  if (activeOffers.length === 0) return null;

  return (
    <div className="border-border-card bg-tertiary-bg flex shrink-0 items-center justify-between gap-2 border-b px-4 py-1.5">
      <p
        className="text-primary-text flex items-center gap-2 text-sm"
        role="status"
      >
        <Icon
          icon="heroicons:arrows-right-left"
          className="text-link h-4 w-4 shrink-0"
        />
        {activeOffers.length} active trade{" "}
        {activeOffers.length === 1 ? "offer" : "offers"}
      </p>
      {activeOffers.length === 1 ? (
        <Button
          size="sm"
          variant="secondary"
          className="shrink-0"
          onClick={() => onViewOffer(activeOffers[0].message)}
        >
          View offer
        </Button>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="secondary" className="shrink-0">
              View offers
              <Icon icon="heroicons:chevron-down" className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="max-h-72 w-72 overflow-y-auto"
          >
            {activeOffers.map(({ message, offer }) => (
              <DropdownMenuItem
                key={message.id}
                className="flex-col items-start gap-1"
                onSelect={() => onViewOffer(message)}
              >
                <span className="w-full truncate text-sm">
                  Offering:{" "}
                  {formatOfferItemSummary(normalizeOfferItems(offer.offering))}
                </span>
                <span className="text-secondary-text w-full truncate text-xs">
                  Requesting:{" "}
                  {formatOfferItemSummary(
                    normalizeOfferItems(offer.requesting),
                  )}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
