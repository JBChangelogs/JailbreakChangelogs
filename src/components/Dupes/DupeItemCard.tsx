"use client";

import type { CatalogValues } from "@/hooks/usePartialItems";
import Image from "next/image";
import { DefaultAvatar } from "@/utils/ui/avatar";
import Link from "next/link";
import { useState } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { Icon } from "@/components/ui/IconWrapper";
import { DupeFinderItem } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getDupeComparisonUrl } from "@/utils/dupeComparisonUrl";
import { checkDupe, type DupeCheckResult } from "@/utils/api/dupeCheck";
import {
  getItemImagePath,
  isVideoItem,
  isDriftItem,
  getDriftVideoPath,
  getVideoPath,
  handleImageError,
} from "@/utils/ui/images";
import {
  getCategoryIcon,
  getCategoryColor,
  CategoryIconBadge,
} from "@/utils/items/categoryIcons";
import { hasSeason, unlockLevel } from "@/utils/items/season";
import {
  formatUnlockLevelBadge,
  formatUnlockRequirementsTooltip,
  hasUnlockLevel,
} from "@/utils/items/itemUnlockPresentation";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { bangers } from "@/app/fonts";
import ItemSignatures from "@/components/Items/ItemSignatures";
import {
  formatMonthDayYear,
  formatShortDateTime,
  formatRelativeDate,
} from "@/utils/helpers/timestamp";

interface DupeItemCardProps {
  item: DupeFinderItem;
  itemData: CatalogValues;
  getUserAvatar: (userId: string) => string;
  getUsername: (userId: string) => string;
  onCardClick: (item: DupeFinderItem) => void;
  onReport: (item: DupeFinderItem) => void;
  duplicateNumber?: number;
  isDuplicate?: boolean;
  robloxId: string;
  ownerLabel?: string;
  bgClass?: string;
  isDupedItem?: boolean;
}

export default function DupeItemCard({
  item,
  itemData,
  getUserAvatar,
  getUsername,
  onCardClick,
  onReport,
  duplicateNumber,
  isDuplicate = false,
  robloxId,
  ownerLabel = "ORIGINAL OWNER",
  isDupedItem = false,
}: DupeItemCardProps) {
  const [isAvatarLoading, setIsAvatarLoading] = useState(true);
  const [avatarError, setAvatarError] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<DupeCheckResult | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [checkOpen, setCheckOpen] = useState(false);
  const originalOwner =
    item.info?.find((entry) => entry.title === "Original Owner")?.value ||
    robloxId;

  const runCheck = async () => {
    if (checking) return;
    setCheckOpen(true);
    setChecking(true);
    setCheckError(null);
    setCheckResult(null);
    try {
      setCheckResult(await checkDupe(originalOwner, item.item_id));
    } catch (error) {
      setCheckError(
        error instanceof Error ? error.message : "Unable to check this dupe.",
      );
    } finally {
      setChecking(false);
    }
  };
  const checkDetails = checkResult
    ? [
        {
          label: "History change",
          description: "Whether the history difference exceeds 30%.",
          flagged: checkResult.ratio > 0.3,
        },
        {
          label: "Pattern analysis",
          description: "Trading patterns associated with duplicated items.",
          flagged: checkResult.check,
        },
        {
          label: "Dupe threshold",
          description: "Whether this check flags the item as duplicated.",
          flagged: checkResult.is_duped,
        },
      ]
    : [];
  const canReport =
    !checking &&
    (!checkResult || checkDetails.some((detail) => !detail.flagged));
  const displayedSeason = itemData.season ?? undefined;
  const displayedLevel = unlockLevel(itemData.level);
  const isSeasonal = itemData?.is_seasonal === 1 || hasSeason(itemData);
  const hasDisplayedLevel = hasUnlockLevel(displayedLevel);
  const requirementsTooltipText = formatUnlockRequirementsTooltip(
    displayedSeason,
    displayedLevel,
  );

  return (
    <div
      className={`text-primary-text relative flex flex-col rounded-lg border p-3 ${
        isDupedItem
          ? "bg-button-danger/10 border-button-danger"
          : "border-border-card bg-tertiary-bg"
      }`}
    >
      {/* Duplicate Indicator */}
      {isDuplicate && duplicateNumber && (
        <div
          className="bg-button-info text-form-button-text absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
          aria-label={`Duplicate item number ${duplicateNumber}`}
        >
          #{duplicateNumber}
        </div>
      )}

      {/* Title */}
      <div className="mb-4 text-left">
        <h2
          className={`${bangers.className} text-primary-text mb-1 text-2xl tracking-wide wrap-break-word`}
        >
          <Link
            href={`/item/${encodeURIComponent(item.categoryTitle)}/${encodeURIComponent(item.title)}`}
            className="hover:text-link-hover transition-colors"
            prefetch={false}
          >
            {item.title}
          </Link>
        </h2>
        <div className="flex items-center gap-2">
          <span
            className="text-primary-text bg-tertiary-bg/40 flex h-6 items-center gap-1.5 rounded-md border px-2.5 text-xs leading-none font-medium backdrop-blur-xl"
            style={{
              borderColor: getCategoryColor(item.categoryTitle),
              backgroundColor: `${getCategoryColor(item.categoryTitle)}22`,
            }}
          >
            {(() => {
              const categoryIcon = getCategoryIcon(item.categoryTitle);
              return categoryIcon ? (
                <categoryIcon.Icon
                  className="h-3 w-3"
                  style={{ color: getCategoryColor(item.categoryTitle) }}
                />
              ) : null;
            })()}
            <span>{item.categoryTitle}</span>
          </span>
          {isDupedItem && (
            <span className="border-button-danger bg-button-danger text-form-button-text flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium">
              Duped
            </span>
          )}
        </div>
      </div>

      {/* Item Image */}
      <div className="relative mb-3 aspect-video w-full overflow-hidden rounded-lg">
        {(itemData?.is_limited === 1 || isSeasonal) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="absolute top-2 right-2 z-10">
                <CategoryIconBadge
                  type={item.categoryTitle}
                  isLimited={itemData?.is_limited === 1}
                  isSeasonal={isSeasonal}
                  className="h-4 w-4"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {isSeasonal ? "Seasonal item" : "Limited item"}
            </TooltipContent>
          </Tooltip>
        )}
        {(displayedSeason != null || hasDisplayedLevel) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="absolute right-2 bottom-2 z-10 flex cursor-help items-center gap-1">
                {typeof displayedSeason === "number" && (
                  <span className="bg-button-info text-form-button-text inline-flex h-6 items-center rounded-md px-2 text-xs leading-none font-bold">
                    S{displayedSeason}
                  </span>
                )}
                {hasDisplayedLevel && (
                  <span className="bg-status-success text-form-button-text inline-flex h-6 items-center rounded-md px-2 text-xs leading-none font-bold">
                    {formatUnlockLevelBadge(displayedLevel)}
                  </span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>{requirementsTooltipText}</TooltipContent>
          </Tooltip>
        )}
        {!["Brakes"].includes(item.categoryTitle) ? (
          isVideoItem(item.title) ? (
            <video
              src={getVideoPath(item.categoryTitle, item.title)}
              className="h-full w-full object-cover"
              muted
              playsInline
              loop
              autoPlay
            />
          ) : isDriftItem(item.categoryTitle) ? (
            <div className="relative h-full w-full">
              <Image
                src={getItemImagePath(item.categoryTitle, item.title, true)}
                alt={item.title}
                fill
                className="object-cover"
                onError={handleImageError}
              />
              <video
                src={getDriftVideoPath(item.title, true)}
                className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 hover:opacity-100"
                muted
                playsInline
                loop
              />
            </div>
          ) : (
            <Image
              src={getItemImagePath(item.categoryTitle, item.title, true)}
              alt={item.title}
              fill
              className="object-cover"
              onError={handleImageError}
            />
          )
        ) : (
          <Image
            src={getItemImagePath(item.categoryTitle, item.title, true)}
            alt={item.title}
            fill
            className="object-cover"
            onError={handleImageError}
          />
        )}
        <ItemSignatures signs={item.Sign} />
      </div>

      <div className="flex flex-1 flex-col gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="border-border-card bg-quaternary-bg relative h-8 w-8 shrink-0 overflow-hidden rounded-full border">
            {avatarError ? (
              <DefaultAvatar name={getUsername(originalOwner)} />
            ) : (
              <>
                {isAvatarLoading && (
                  <Spinner className="absolute inset-0 m-auto h-4 w-4" />
                )}
                <Image
                  src={getUserAvatar(originalOwner)}
                  alt="Original owner avatar"
                  width={32}
                  height={32}
                  className="rounded-full"
                  onLoad={() => setIsAvatarLoading(false)}
                  onError={() => {
                    setIsAvatarLoading(false);
                    setAvatarError(true);
                  }}
                />
              </>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-secondary-text text-xs">{ownerLabel}</p>
            <a
              href={`https://www.roblox.com/users/${originalOwner}/profile`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-link hover:text-link-hover block truncate text-sm font-semibold hover:underline"
              title={getUsername(originalOwner)}
            >
              {getUsername(originalOwner)}
            </a>
          </div>
        </div>
        <p className="text-secondary-text text-xs">
          Logged {formatMonthDayYear(item.logged_at)}
        </p>
        <div className="mt-auto grid grid-cols-3 gap-2">
          <Button
            type="button"
            size="sm"
            disabled={checking}
            className="h-auto! min-h-8 min-w-0 px-2! py-1 text-center text-xs! leading-4 whitespace-normal"
            onClick={() => void runCheck()}
          >
            {checking ? "Checking..." : "Dupe check"}
          </Button>
          <Button
            asChild
            size="sm"
            variant="secondary"
            className="h-auto! min-h-8 min-w-0 px-2! py-1 text-center text-xs! leading-4 whitespace-normal"
          >
            <Link
              href={getDupeComparisonUrl(item)}
              prefetch={false}
              target="_blank"
              rel="noopener noreferrer"
              title="View variant ownership histories in a new tab"
            >
              Comparison
            </Link>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-auto! min-h-8 min-w-0 px-2! py-1 text-center text-xs! leading-4 whitespace-normal"
            onClick={() => onCardClick(item)}
          >
            History
          </Button>
        </div>
      </div>
      <Dialog open={checkOpen} onOpenChange={setCheckOpen}>
        <DialogContent className="w-[calc(100%_-_2rem)] max-w-3xl" showClose>
          <DialogHeader className="pr-5 text-left">
            <DialogTitle>Dupe check: {item.title}</DialogTitle>
            <DialogDescription className="wrap-anywhere">
              Original owner:{" "}
              <span className="text-primary-text font-medium">
                {getUsername(originalOwner)}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div aria-live="polite" aria-busy={checking}>
            {checking ? (
              <div className="text-secondary-text flex items-center gap-3 py-6 text-sm">
                <Spinner className="h-5 w-5 shrink-0" />
                Checking the recorded ownership history...
              </div>
            ) : checkError ? (
              <p
                className="border-status-error/30 bg-status-error/10 text-status-error rounded-lg border p-3 text-sm"
                role="alert"
              >
                {checkError}
              </p>
            ) : checkResult ? (
              <div className="mt-4 space-y-3">
                <div
                  className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 ${checkResult.is_duped ? "border-status-error/30 bg-status-error/10" : "border-border-card bg-tertiary-bg"}`}
                >
                  <p
                    className={`text-sm font-semibold ${checkResult.is_duped ? "text-status-error" : "text-primary-text"}`}
                  >
                    {checkResult.is_duped
                      ? "Flagged as duped"
                      : "Not flagged by this check"}
                  </p>
                  <p className="text-secondary-text text-sm">
                    History difference:{" "}
                    <span className="text-primary-text font-semibold tabular-nums">
                      {(checkResult.ratio * 100).toFixed(2)}%
                    </span>
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="border-border-card bg-tertiary-bg rounded-lg border p-3">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-primary-text text-sm font-semibold">
                        Check details
                      </h3>
                      <span className="bg-button-info/10 text-primary-text rounded-md px-2 py-1 text-sm font-medium tabular-nums">
                        {`Checks flagged: ${checkDetails.filter((detail) => detail.flagged).length}/${checkDetails.length}`}
                      </span>
                    </div>
                    <ul className="divide-border-card divide-y">
                      {checkDetails.map((detail) => (
                        <li
                          key={detail.label}
                          className="py-3 first:pt-0 last:pb-0"
                        >
                          <div className="flex items-center gap-2 text-sm">
                            <Icon
                              icon={
                                detail.flagged
                                  ? "heroicons:exclamation-circle"
                                  : "heroicons:minus-circle"
                              }
                              className={`h-4 w-4 shrink-0 ${detail.flagged ? "text-status-error" : "text-secondary-text"}`}
                              aria-hidden="true"
                            />
                            <span className="text-primary-text min-w-0 flex-1 font-medium">
                              {detail.label}
                            </span>
                            <span
                              className={`shrink-0 ${detail.flagged ? "text-status-error" : "text-secondary-text"}`}
                            >
                              {detail.flagged ? "Flagged" : "Not flagged"}
                            </span>
                          </div>
                          <p className="text-secondary-text mt-1 pl-6 text-sm">
                            {detail.description}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <dl className="divide-border-card border-border-card grid divide-y rounded-lg border text-sm sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                    <div className="px-3 py-2">
                      <dt className="text-secondary-text mb-1 text-sm">
                        Dupe logged
                      </dt>
                      <dd className="text-primary-text text-sm">
                        {checkResult.dupe_logged_at > 0 ? (
                          <>
                            <span>
                              {formatShortDateTime(checkResult.dupe_logged_at)}
                            </span>
                            <span className="text-secondary-text mt-0.5 block">
                              ({formatRelativeDate(checkResult.dupe_logged_at)})
                            </span>
                          </>
                        ) : (
                          <span>Not available</span>
                        )}
                      </dd>
                    </div>
                    <div className="px-3 py-2">
                      <dt className="text-secondary-text mb-1 text-sm">
                        Original logged
                      </dt>
                      <dd className="text-primary-text text-sm">
                        {checkResult.original_logged_at > 0 ? (
                          <>
                            <span>
                              {formatShortDateTime(
                                checkResult.original_logged_at,
                              )}
                            </span>
                            <span className="text-secondary-text mt-0.5 block">
                              (
                              {formatRelativeDate(
                                checkResult.original_logged_at,
                              )}
                              )
                            </span>
                          </>
                        ) : (
                          <span>Not available</span>
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>
                {canReport && (
                  <p className="text-secondary-text text-sm">
                    Review the comparison before reporting a false dupe.
                  </p>
                )}
              </div>
            ) : null}
          </div>
          <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end sm:space-x-0">
            {checkResult && (
              <Button asChild size="sm" className="w-full sm:w-auto">
                <Link
                  href={getDupeComparisonUrl(item)}
                  prefetch={false}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="View variant ownership histories in a new tab"
                >
                  Comparison
                </Link>
              </Button>
            )}
            {canReport && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-auto! min-h-8 w-full min-w-0 px-2! py-1 leading-tight whitespace-normal sm:w-auto"
                onClick={() => {
                  setCheckOpen(false);
                  onReport(item);
                }}
              >
                Report false dupe
              </Button>
            )}
            {checkError && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-auto! min-h-8 w-full min-w-0 px-2! py-1 leading-tight whitespace-normal sm:w-auto"
                onClick={() => void runCheck()}
              >
                Try again
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
