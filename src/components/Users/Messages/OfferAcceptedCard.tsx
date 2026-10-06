"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import { Spinner } from "@/components/ui/Spinner";
import type { useOfferDetailsBatch } from "@/hooks/useOfferDetailsBatch";
import { asId, normalizeOfferItems } from "@/utils/messages/parsing";
import { formatMessageText } from "@/utils/messages/formatting";
import type { OfferAcceptedMetadata } from "@/utils/messages/types";
import { respondToTradeOfferV2 } from "@/utils/trading/core";
import { OfferItems } from "./OfferItems";

export function OfferAcceptedCard({
  metadata,
  currentUserId,
  offerDetails,
}: {
  metadata: OfferAcceptedMetadata;
  currentUserId: string | null;
  offerDetails: ReturnType<typeof useOfferDetailsBatch>;
}) {
  const [isCompleting, setIsCompleting] = useState(false);
  const completingRef = useRef(false);
  const key = `${metadata.trade}:${metadata.offer}`;
  const offer = offerDetails.map[key];
  const isCompleted = offer?.status === 3;
  const canComplete =
    !!currentUserId &&
    (typeof metadata.trade_user === "string" ||
      typeof metadata.trade_user === "number") &&
    asId(metadata.trade_user) === currentUserId &&
    offer?.status === 1;

  const complete = async () => {
    if (!canComplete || !offer || completingRef.current) return;
    completingRef.current = true;
    setIsCompleting(true);
    try {
      await respondToTradeOfferV2(metadata.trade, metadata.offer, "complete");
      await offerDetails.markCompleted(offer);
      toast.success("Offer marked completed");
    } catch (error) {
      completingRef.current = false;
      toast.error(
        error instanceof Error ? error.message : "Failed to mark completed",
      );
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="bg-tertiary-bg relative mt-1 w-full max-w-md overflow-hidden rounded-2xl px-4 py-3 whitespace-normal">
      <span className="bg-link absolute inset-y-0 left-0 w-1" />
      <p className="text-link flex items-center gap-1.5 text-sm font-semibold">
        <Icon icon="heroicons:check-circle" className="h-4 w-4 shrink-0" />
        Trade offer accepted
      </p>
      {offer ? (
        <>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <OfferItems
              label="Offering"
              display="text"
              items={normalizeOfferItems(offer.offering)}
              expanded
              maxCollapsed={Number.MAX_SAFE_INTEGER}
            />
            <OfferItems
              label="Requesting"
              display="text"
              items={normalizeOfferItems(offer.requesting)}
              expanded
              maxCollapsed={Number.MAX_SAFE_INTEGER}
            />
          </div>
          {offer.note && (
            <p className="text-secondary-text mt-2 text-xs wrap-break-word whitespace-pre-wrap">
              Note: {formatMessageText(offer.note)}
            </p>
          )}
        </>
      ) : (
        <p className="text-secondary-text mt-2 text-xs" role="status">
          {offerDetails.status === "error" ? (
            "Unable to load trade offer details."
          ) : offerDetails.status === "idle" ? (
            "Trade offer details are unavailable."
          ) : offer === null ? (
            "Trade offer details are no longer available."
          ) : (
            <span className="flex items-center gap-2">
              <Spinner className="h-3.5 w-3.5" />
              Loading offer details…
            </span>
          )}
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button asChild size="sm">
          <Link
            href={`/trading/ad/${metadata.trade}`}
            prefetch={false}
            target="_blank"
            rel="noopener noreferrer"
          >
            View trade
          </Link>
        </Button>
        {canComplete && (
          <Button
            variant="success"
            size="sm"
            disabled={isCompleting}
            onClick={() => void complete()}
          >
            {isCompleting ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <Icon icon="heroicons:check" className="h-4 w-4" />
            )}
            {isCompleting ? "Marking completed…" : "Mark completed"}
          </Button>
        )}
        {isCompleted && (
          <span
            className="text-secondary-text text-xs font-medium"
            role="status"
          >
            Completed
          </span>
        )}
      </div>
    </div>
  );
}
