"use client";

import type { Dispatch, SetStateAction } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import { Spinner } from "@/components/ui/Spinner";
import { OfferItems } from "@/components/Users/Messages/OfferItems";
import { UserAvatar } from "@/utils/ui/avatar";
import { cn } from "@/lib/utils";
import { respondToTradeOfferV2 } from "@/utils/trading/core";
import type { TradeOfferDetails } from "@/hooks/useOfferDetailsBatch";
import type {
  MessageUser,
  OfferAcceptedMetadata,
  OfferItem,
} from "@/utils/messages/types";
import {
  formatMessageText,
  formatOfferItemSummary,
  getDisplayName,
} from "@/utils/messages/formatting";

export type OfferAcceptedEvent = {
  messageId: string;
  createdAt: number;
  metadata: OfferAcceptedMetadata;
};

export type ActiveOfferDetailsStatus =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "loaded"; data: TradeOfferDetails }
  | { status: "not_found" }
  | { status: "error"; error: string };

interface OfferAcceptedBannerProps {
  showOfferAcceptedBanner: boolean;
  selectedUser: MessageUser | null;
  currentUserEnriched: MessageUser | null;
  visibleOfferAcceptedEvents: OfferAcceptedEvent[];
  offerAcceptedEvents: OfferAcceptedEvent[];
  activeOfferAcceptedIndex: number;
  setActiveOfferAcceptedIndex: Dispatch<SetStateAction<number>>;
  activeOfferDetailsStatus: ActiveOfferDetailsStatus;
  activeOfferItems: {
    offering: OfferItem[];
    requesting: OfferItem[];
  } | null;
  isOfferBannerMinimized: boolean;
  setIsOfferBannerMinimized: Dispatch<SetStateAction<boolean>>;
  canMarkOfferComplete: boolean;
  isMarkingOfferComplete: boolean;
  setIsMarkingOfferComplete: Dispatch<SetStateAction<boolean>>;
  getOfferDetailsKey: (metadata: OfferAcceptedMetadata) => string;
  setOfferDetailsMap: Dispatch<
    SetStateAction<Record<string, TradeOfferDetails | null>>
  >;
}

export function OfferAcceptedBanner({
  showOfferAcceptedBanner,
  selectedUser,
  currentUserEnriched,
  visibleOfferAcceptedEvents,
  offerAcceptedEvents,
  activeOfferAcceptedIndex,
  setActiveOfferAcceptedIndex,
  activeOfferDetailsStatus,
  activeOfferItems,
  isOfferBannerMinimized,
  setIsOfferBannerMinimized,
  canMarkOfferComplete,
  isMarkingOfferComplete,
  setIsMarkingOfferComplete,
  getOfferDetailsKey,
  setOfferDetailsMap,
}: OfferAcceptedBannerProps) {
  return (
    <>
      {showOfferAcceptedBanner ? (
        <div className="border-border-card bg-tertiary-bg border-b px-4 py-2">
          <div className="border-link bg-button-info/10 grid grid-cols-1 gap-3 rounded-l-none rounded-r-md border-l-2 px-3 py-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
            <div className="min-w-0 overflow-hidden">
              <div className="flex items-center gap-2">
                <p className="text-primary-text truncate text-sm font-semibold">
                  <span className="sm:hidden">Offer accepted</span>
                  <span className="hidden sm:inline">Trade offer accepted</span>
                </p>
                {activeOfferDetailsStatus.status === "loaded" ? (
                  <button
                    type="button"
                    aria-label={
                      isOfferBannerMinimized
                        ? "Show trade details"
                        : "Hide trade details"
                    }
                    aria-pressed={!isOfferBannerMinimized}
                    onClick={() => setIsOfferBannerMinimized((prev) => !prev)}
                    className="text-secondary-text hover:text-primary-text hover:bg-quaternary-bg focus-visible:ring-ring inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:ring-1 focus-visible:outline-none"
                  >
                    <Icon
                      icon={
                        isOfferBannerMinimized
                          ? "heroicons:chevron-down"
                          : "heroicons:chevron-up"
                      }
                      className="h-5 w-5"
                    />
                  </button>
                ) : null}
              </div>
              {activeOfferDetailsStatus.status === "loading" ? (
                <p className="text-secondary-text flex items-center gap-2 text-xs">
                  <Spinner className="h-3.5 w-3.5" />
                  Loading offer details…
                </p>
              ) : activeOfferDetailsStatus.status === "loaded" ? (
                <>
                  {isOfferBannerMinimized ? (
                    <>
                      {currentUserEnriched && selectedUser ? (
                        <div className="mt-1 flex items-center gap-2">
                          <div className="flex items-center gap-1.5">
                            <UserAvatar
                              userId={currentUserEnriched.id}
                              avatarHash={currentUserEnriched.avatar}
                              username={getDisplayName(currentUserEnriched)}
                              custom_avatar={currentUserEnriched.custom_avatar}
                              settings={currentUserEnriched.settings_v2}
                              premiumType={currentUserEnriched.premiumtype}
                              showBadge={false}
                              size={5}
                            />
                            <Icon
                              icon="heroicons:arrows-right-left"
                              className="text-secondary-text h-4 w-4"
                            />
                            <UserAvatar
                              userId={selectedUser.id}
                              avatarHash={selectedUser.avatar}
                              username={getDisplayName(selectedUser)}
                              custom_avatar={selectedUser.custom_avatar}
                              settings={selectedUser.settings_v2}
                              premiumType={selectedUser.premiumtype}
                              showBadge={false}
                              size={5}
                            />
                          </div>
                          <p className="text-secondary-text min-w-0 truncate text-xs tabular-nums">
                            Offer{" "}
                            <span className="text-primary-text/80">
                              #{activeOfferDetailsStatus.data.id}
                            </span>{" "}
                            • Trade{" "}
                            <span className="text-primary-text/80">
                              #{activeOfferDetailsStatus.data.trade}
                            </span>
                          </p>
                        </div>
                      ) : (
                        <p className="text-secondary-text mt-1 text-xs tabular-nums">
                          Offer{" "}
                          <span className="text-primary-text/80">
                            #{activeOfferDetailsStatus.data.id}
                          </span>{" "}
                          • Trade{" "}
                          <span className="text-primary-text/80">
                            #{activeOfferDetailsStatus.data.trade}
                          </span>
                        </p>
                      )}
                      <p className="text-secondary-text mt-1 truncate text-xs">
                        Offering:{" "}
                        <span className="text-primary-text/80">
                          {formatOfferItemSummary(
                            activeOfferItems?.offering ?? [],
                          )}
                        </span>{" "}
                        • Requesting:{" "}
                        <span className="text-primary-text/80">
                          {formatOfferItemSummary(
                            activeOfferItems?.requesting ?? [],
                          )}
                        </span>
                      </p>
                      {activeOfferDetailsStatus.data.note ? (
                        <p className="text-secondary-text mt-1 truncate text-xs">
                          Note:{" "}
                          <span className="text-primary-text/70">
                            {formatMessageText(
                              activeOfferDetailsStatus.data.note,
                            )}
                          </span>
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <OfferItems
                        label="Offering"
                        items={activeOfferItems?.offering ?? []}
                        expanded={true}
                        display="text"
                        maxCollapsed={Number.MAX_SAFE_INTEGER}
                      />
                      <OfferItems
                        label="Requesting"
                        items={activeOfferItems?.requesting ?? []}
                        expanded={true}
                        display="text"
                        maxCollapsed={Number.MAX_SAFE_INTEGER}
                      />
                    </div>
                  )}
                </>
              ) : activeOfferDetailsStatus.status === "not_found" ? (
                <p className="text-secondary-text truncate text-xs">
                  This trade offer no longer exists.
                </p>
              ) : activeOfferDetailsStatus.status === "error" ? (
                <p className="text-secondary-text truncate text-xs">
                  {activeOfferDetailsStatus.error}
                </p>
              ) : null}
            </div>

            <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end sm:gap-1">
                <button
                  type="button"
                  aria-label="Previous accepted offer"
                  disabled={activeOfferAcceptedIndex <= 0}
                  onClick={() =>
                    setActiveOfferAcceptedIndex((prev) => Math.max(prev - 1, 0))
                  }
                  className={cn(
                    "text-primary-text flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                    "hover:bg-quaternary-bg cursor-pointer disabled:opacity-50 disabled:hover:bg-transparent",
                  )}
                >
                  <Icon icon="heroicons:chevron-left" className="h-5 w-5" />
                </button>
                <span className="text-secondary-text w-12 text-center text-[11px] tabular-nums">
                  {Math.min(
                    activeOfferAcceptedIndex + 1,
                    visibleOfferAcceptedEvents.length,
                  )}{" "}
                  / {visibleOfferAcceptedEvents.length}
                </span>
                <button
                  type="button"
                  aria-label="Next accepted offer"
                  disabled={
                    activeOfferAcceptedIndex >=
                    visibleOfferAcceptedEvents.length - 1
                  }
                  onClick={() =>
                    setActiveOfferAcceptedIndex((prev) =>
                      Math.min(prev + 1, visibleOfferAcceptedEvents.length - 1),
                    )
                  }
                  className={cn(
                    "text-primary-text flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                    "hover:bg-quaternary-bg cursor-pointer disabled:opacity-50 disabled:hover:bg-transparent",
                  )}
                >
                  <Icon icon="heroicons:chevron-right" className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-end sm:gap-2">
                <Button asChild size="sm" className="h-8 w-full sm:w-auto">
                  <Link
                    href={`/trading/ad/${offerAcceptedEvents[activeOfferAcceptedIndex]?.metadata.trade ?? ""}`}
                    prefetch={false}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-disabled={
                      activeOfferDetailsStatus.status === "not_found"
                    }
                    onClick={(event) => {
                      if (activeOfferDetailsStatus.status === "not_found") {
                        event.preventDefault();
                      }
                    }}
                  >
                    <span className="md:hidden">View</span>
                    <span className="hidden md:inline">View trade</span>
                  </Link>
                </Button>
                {canMarkOfferComplete &&
                  activeOfferDetailsStatus.status === "loaded" &&
                  activeOfferDetailsStatus.data.status !== 3 && (
                    <Button
                      variant="success"
                      size="sm"
                      className="h-8 w-full sm:w-auto"
                      disabled={isMarkingOfferComplete}
                      onClick={() => {
                        if (isMarkingOfferComplete) return;
                        const active =
                          visibleOfferAcceptedEvents[activeOfferAcceptedIndex];
                        if (!active) return;
                        setIsMarkingOfferComplete(true);
                        const toastId = toast.loading(
                          "Marking offer as completed...",
                          { duration: Infinity },
                        );
                        void (async () => {
                          try {
                            await respondToTradeOfferV2(
                              active.metadata.trade ?? 0,
                              active.metadata.offer ?? 0,
                              "complete",
                            );
                            toast.success("Offer marked completed", {
                              id: toastId,
                              duration: 4000,
                            });

                            const key = getOfferDetailsKey(active.metadata);
                            setOfferDetailsMap((prev) => ({
                              ...prev,
                              [key]: prev[key]
                                ? {
                                    ...(prev[key] as TradeOfferDetails),
                                    status: 3,
                                  }
                                : null,
                            }));
                          } catch (err) {
                            toast.error(
                              err instanceof Error
                                ? err.message
                                : "Failed to mark completed",
                              { id: toastId, duration: 5000 },
                            );
                          } finally {
                            setIsMarkingOfferComplete(false);
                          }
                        })();
                      }}
                    >
                      <Icon icon="heroicons:check" className="h-4 w-4" />
                      <span className="md:hidden">Complete</span>
                      <span className="hidden md:inline">Mark completed</span>
                    </Button>
                  )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
