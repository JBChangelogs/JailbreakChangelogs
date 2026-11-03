"use client";

import { useState } from "react";
import Link from "next/link";
import type { DupeFinderItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/Spinner";
import { Icon } from "@/components/ui/IconWrapper";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { checkDupe, type DupeCheckResult } from "@/utils/api/dupeCheck";
import { getDupeComparisonUrl } from "@/utils/dupeComparisonUrl";
import { getCategoryColor, getCategoryIcon } from "@/utils/items/categoryIcons";
import {
  formatShortDateTime,
  formatRelativeDate,
} from "@/utils/helpers/timestamp";

export default function DupeCheckButton({
  item,
  originalOwner,
  ownerName,
  onReport,
  className,
  showComparison = true,
}: {
  item: Pick<DupeFinderItem, "id" | "item_id" | "title"> &
    Partial<Pick<DupeFinderItem, "categoryTitle" | "info">>;
  originalOwner: string;
  ownerName: string;
  onReport: () => void;
  className?: string;
  showComparison?: boolean;
}) {
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<DupeCheckResult | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [checkOpen, setCheckOpen] = useState(false);
  const categoryIcon = item.categoryTitle
    ? getCategoryIcon(item.categoryTitle)
    : null;
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

  return (
    <>
      <Button
        type="button"
        size="sm"
        disabled={checking}
        className={className}
        onClick={() => void runCheck()}
      >
        {checking ? "Checking..." : "Dupe check"}
      </Button>
      <Dialog open={checkOpen} onOpenChange={setCheckOpen}>
        <DialogContent className="w-[calc(100%_-_2rem)] max-w-3xl" showClose>
          <DialogHeader className="pr-5 text-left">
            <div className="flex flex-wrap items-center gap-3">
              <DialogTitle>Dupe check: {item.title}</DialogTitle>
              {item.categoryTitle && (
                <span
                  className="text-primary-text inline-flex h-6 items-center rounded-md border px-2.5 text-xs leading-none font-medium"
                  style={{
                    borderColor: getCategoryColor(item.categoryTitle),
                    backgroundColor: `${getCategoryColor(item.categoryTitle)}22`,
                  }}
                >
                  {categoryIcon && (
                    <categoryIcon.Icon
                      className="mr-1.5 h-3 w-3"
                      style={{ color: getCategoryColor(item.categoryTitle) }}
                    />
                  )}
                  {item.categoryTitle}
                </span>
              )}
            </div>
            <DialogDescription className="wrap-anywhere">
              Original owner:{" "}
              <span className="text-primary-text font-medium">{ownerName}</span>
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
                  <dl className="divide-border-card border-border-card bg-tertiary-bg grid divide-y rounded-lg border text-sm sm:grid-cols-2 sm:divide-x sm:divide-y-0">
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
            {checkResult && showComparison && (
              <Button asChild size="sm" className="w-full sm:w-auto">
                <Link
                  href={getDupeComparisonUrl(item)}
                  prefetch={false}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Compare copies’ trade histories in a new tab"
                >
                  Compare histories
                </Link>
              </Button>
            )}
            {canReport && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={() => {
                  setCheckOpen(false);
                  onReport();
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
                className="w-full sm:w-auto"
                onClick={() => void runCheck()}
              >
                Try again
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
