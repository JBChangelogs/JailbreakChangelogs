"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { DupeFinderItem, Item } from "@/types";
import { useBatchUserData } from "@/hooks/useBatchUserData";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Icon } from "@/components/ui/IconWrapper";
import { Button } from "@/components/ui/button";
import { IMAGE_PLACEHOLDER } from "@/utils/ui/imagePlaceholder";
import { getCategoryColor, getCategoryIcon } from "@/utils/items/categoryIcons";
import {
  getItemImagePath,
  isVideoItem,
  isDriftItem,
  getDriftVideoPath,
  getVideoPath,
  handleImageError,
} from "@/utils/ui/images";
import DupeCheckButton from "./DupeCheckButton";
import ReportFalseDupeModal from "./ReportFalseDupeModal";
import { OriginalOwnerCard } from "./TradeHistoryList";

export default function DupeComparisonHeader({
  ogItem,
  duplicateItem,
  itemsData,
}: {
  ogItem: DupeFinderItem;
  duplicateItem: DupeFinderItem;
  itemsData: Item[];
}) {
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportState, setReportState] = useState<
    "submitted" | "already_reported" | null
  >(null);
  const { isAuthenticated, setLoginModal } = useAuthContext();

  const openReportModal = () => {
    if (!isAuthenticated) {
      toast.info("You must be logged in to report a false dupe.");
      setLoginModal({ open: true });
      return;
    }
    setReportModalOpen(true);
  };

  const originalOwnerId =
    ogItem.info?.find((i) => i.title === "Original Owner")?.value ||
    ogItem.user_id;
  const normalizedOriginalOwnerId = originalOwnerId
    ? String(originalOwnerId)
    : null;

  const leftOrigin = duplicateItem.history?.[0];
  const rightOrigin = ogItem.history?.[0];
  const sharedOrigin =
    leftOrigin &&
    rightOrigin &&
    leftOrigin.UserId === rightOrigin.UserId &&
    leftOrigin.TradeTime === rightOrigin.TradeTime
      ? leftOrigin
      : undefined;
  const { robloxUsers } = useBatchUserData(
    [normalizedOriginalOwnerId, sharedOrigin?.UserId.toString()].filter(
      Boolean,
    ) as string[],
  );
  const sharedItemData = itemsData.find(
    (data) => data.id === duplicateItem.item_id,
  );
  if (!sharedItemData) {
    return (
      <div className="py-8 text-center text-red-500">
        Error: Could not find item metadata for ID {duplicateItem.item_id}.
      </div>
    );
  }

  const categoryIcon = getCategoryIcon(duplicateItem.categoryTitle);

  return (
    <div className="space-y-8">
      {originalOwnerId && (
        <div className="flex justify-start">
          <Link
            href={`/dupes/${originalOwnerId}`}
            className="border-border-card bg-secondary-bg text-primary-text hover:bg-tertiary-bg flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
          >
            <Icon icon="mdi:arrow-left" className="h-5 w-5" />
            Back to Player Dupes
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 items-center gap-4 lg:grid-cols-2 lg:gap-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <div
            className="bg-secondary-bg border-border-card relative w-40 shrink-0 overflow-hidden rounded-lg border sm:w-56"
            style={{ aspectRatio: "854 / 480" }}
          >
            {!["Brakes"].includes(duplicateItem.categoryTitle) ? (
              isVideoItem(duplicateItem.title) ? (
                <video
                  src={getVideoPath(
                    duplicateItem.categoryTitle,
                    duplicateItem.title,
                  )}
                  className="h-full w-full object-cover"
                >
                  <track
                    kind="captions"
                    src="/captions/empty.vtt"
                    srcLang="en"
                    label="English"
                    default
                  />
                </video>
              ) : isDriftItem(duplicateItem.categoryTitle) ? (
                <div className="relative h-full w-full">
                  <Image
                    placeholder={IMAGE_PLACEHOLDER}
                    src={getItemImagePath(
                      duplicateItem.categoryTitle,
                      duplicateItem.title,
                      true,
                    )}
                    alt={duplicateItem.title}
                    fill
                    className="object-cover"
                    onError={handleImageError}
                  />
                  <video
                    src={getDriftVideoPath(duplicateItem.title, true)}
                    className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 hover:opacity-100"
                    muted
                    loop
                    playsInline
                  />
                </div>
              ) : (
                <Image
                  placeholder={IMAGE_PLACEHOLDER}
                  src={getItemImagePath(
                    duplicateItem.categoryTitle,
                    duplicateItem.title,
                    true,
                  )}
                  alt={duplicateItem.title}
                  fill
                  className="object-cover"
                  onError={handleImageError}
                />
              )
            ) : (
              <Image
                placeholder={IMAGE_PLACEHOLDER}
                src={getItemImagePath(
                  duplicateItem.categoryTitle,
                  duplicateItem.title,
                  true,
                )}
                alt={duplicateItem.title}
                fill
                className="object-cover"
                onError={handleImageError}
              />
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <Link
              href={`/item/${encodeURIComponent(duplicateItem.categoryTitle)}/${encodeURIComponent(duplicateItem.title)}`}
              className="group mb-2 inline-flex transition-opacity"
            >
              <h2 className="text-primary-text group-hover:text-link-hover text-2xl font-bold wrap-anywhere transition-colors sm:text-3xl">
                {sharedItemData.name}
              </h2>
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="text-primary-text bg-tertiary-bg/40 flex h-6 items-center gap-1.5 rounded-md border px-2.5 text-xs leading-none font-medium backdrop-blur-xl"
                style={{
                  borderColor: getCategoryColor(duplicateItem.categoryTitle),
                  backgroundColor: `${getCategoryColor(duplicateItem.categoryTitle)}22`,
                }}
              >
                {categoryIcon && (
                  <categoryIcon.Icon
                    className="h-3 w-3"
                    style={{
                      color: getCategoryColor(duplicateItem.categoryTitle),
                    }}
                  />
                )}
                {duplicateItem.categoryTitle}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {normalizedOriginalOwnerId && (
                <DupeCheckButton
                  item={duplicateItem}
                  originalOwner={normalizedOriginalOwnerId}
                  ownerName={
                    robloxUsers[normalizedOriginalOwnerId]?.displayName ||
                    robloxUsers[normalizedOriginalOwnerId]?.name ||
                    normalizedOriginalOwnerId
                  }
                  onReport={openReportModal}
                  showComparison={false}
                />
              )}
              {reportState ? (
                <div className="text-primary-text flex items-start gap-2 text-sm">
                  <Icon
                    icon="mdi:check-circle-outline"
                    className="text-button-success mt-0.5 size-5 shrink-0"
                  />
                  <div>
                    <p className="font-semibold">
                      {reportState === "submitted"
                        ? "False dupe report received"
                        : "False dupe already reported"}
                    </p>
                    <p className="text-secondary-text mt-1">
                      This item is queued for review. You don&apos;t need to
                      submit another report.
                    </p>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  className="shrink-0"
                  onClick={openReportModal}
                >
                  Report False Dupe
                </Button>
              )}
            </div>
          </div>
        </div>
        {sharedOrigin && (
          <OriginalOwnerCard
            entry={sharedOrigin}
            user={robloxUsers[sharedOrigin.UserId.toString()]}
          />
        )}
      </div>

      <ReportFalseDupeModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        item={{
          id: duplicateItem.id,
          item_id: duplicateItem.item_id,
          title: duplicateItem.title,
          categoryTitle: duplicateItem.categoryTitle,
        }}
        originalOwner={
          normalizedOriginalOwnerId
            ? {
                id: normalizedOriginalOwnerId,
                displayName:
                  robloxUsers[normalizedOriginalOwnerId]?.displayName ||
                  robloxUsers[normalizedOriginalOwnerId]?.name ||
                  normalizedOriginalOwnerId,
              }
            : undefined
        }
        onReportResolved={setReportState}
      />
    </div>
  );
}
