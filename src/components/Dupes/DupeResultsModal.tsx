"use client";

import React, { useEffect, useState } from "react";
import {
  XMarkIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import Link from "next/link";
import { formatTimestamp, formatRelativeDate } from "@/utils/timestamp";
import ReportDupeModal from "./ReportDupeModal";
import { ItemDetails } from "@/types";
import { TradeAdTooltip } from "../trading/TradeAdTooltip";
import { getCategoryColor } from "@/utils/categoryIcons";
import { Tooltip } from "@mui/material";

interface DupeResult {
  item_id: number;
  owner: string;
  user_id: number | null;
  proof: string | null;
  created_at: number;
}

interface Suggestion {
  message: string;
  suggestedName: string;
  similarity: number;
}

interface DupeResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: DupeResult[];
  loading: boolean;
  error: string | null;
  suggestion: Suggestion | null;
  ownerName: string;
  itemName: string;
  itemDetails: ItemDetails | null;
  allItemDetails: ItemDetails[];
}

const DupeResultsModal: React.FC<DupeResultsModalProps> = ({
  isOpen,
  onClose,
  results,
  loading,
  error,
  suggestion,
  ownerName,
  itemName,
  itemDetails,
  allItemDetails,
}) => {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const uniqueItemsCount = [...new Set(results.map((result) => result.item_id))]
    .length;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="modal-container bg-secondary-bg border-button-info relative mx-4 w-full max-w-4xl rounded-lg border shadow-lg">
          <div className="modal-header text-primary-text flex items-center justify-between px-6 py-4 text-xl font-semibold">
            <h2>Dupe Check Results</h2>
            <button
              onClick={onClose}
              className="text-secondary-text hover:text-primary-text cursor-pointer"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="modal-content p-6">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="border-button-info h-8 w-8 animate-spin rounded-full border-b-2" />
              </div>
            )}

            {error && !suggestion && (
              <div className="text-button-danger py-4 text-center">{error}</div>
            )}

            {suggestion && (
              <div className="space-y-4">
                <div className="text-status-warning py-2 text-center">
                  <div className="flex flex-col items-center">
                    <ExclamationTriangleIcon className="mb-2 h-12 w-12" />
                    <div>
                      {suggestion.message}
                      <br />
                      Did you mean:{" "}
                      <span className="font-bold">
                        {suggestion.suggestedName}
                      </span>
                      ? ({suggestion.similarity.toFixed(1)}% match)
                    </div>
                  </div>
                </div>
                <div className="bg-button-info/10 border-button-info/20 rounded-lg border p-4">
                  <p className="text-secondary-text text-center text-sm">
                    This is a manual report-based system. For more comprehensive
                    dupe detection, try our{" "}
                    <Link
                      href="/dupes"
                      className="text-link hover:text-link-hover font-medium transition-colors hover:underline"
                    >
                      automated dupe checker
                    </Link>
                    .
                  </p>
                </div>
              </div>
            )}

            {!loading && !error && !suggestion && results.length === 0 && (
              <div className="space-y-4">
                <div className="text-status-success flex flex-col items-center justify-center">
                  <FaCheckCircle className="mb-2 h-12 w-12" />
                  <div className="text-center">
                    <div className="text-secondary-text">
                      No dupes found for {ownerName}
                    </div>
                    {itemName && (
                      <div className="text-secondary-text">
                        No dupe record found for {itemName}
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-button-info/10 border-button-info/20 rounded-lg border p-4">
                  <p className="text-secondary-text text-center text-sm">
                    This is a manual report-based system. For more comprehensive
                    dupe detection, try our{" "}
                    <Link
                      href="/dupes"
                      className="text-link hover:text-link-hover font-medium transition-colors hover:underline"
                    >
                      automated dupe checker
                    </Link>
                    .
                  </p>
                </div>
                {itemName && (
                  <div className="flex justify-center">
                    <button
                      disabled
                      className="bg-button-secondary text-secondary-text border-button-secondary cursor-not-allowed rounded-lg border px-4 py-2"
                    >
                      Report {itemName} as duped (Disabled)
                    </button>
                  </div>
                )}
              </div>
            )}

            {!loading && !error && results.length > 0 && (
              <div className="space-y-4">
                {/* Header */}
                <div className="bg-button-danger/10 border-button-danger/20 rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <FaExclamationCircle className="text-button-danger h-6 w-6 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-primary-text text-lg font-semibold">
                        {uniqueItemsCount} Dupe Item
                        {uniqueItemsCount !== 1 ? "s" : ""} Found
                      </h3>
                      <p className="text-secondary-text text-sm">
                        Owner:{" "}
                        <a
                          href={`https://www.roblox.com/users/${results[0].user_id}/profile`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-link hover:text-link-hover font-medium transition-colors hover:underline"
                        >
                          {results[0].owner}
                        </a>
                      </p>
                      <p className="text-secondary-text mt-1 text-xs">
                        Last recorded dupe:{" "}
                        <span className="text-primary-text font-medium">
                          {formatTimestamp(
                            results.reduce((latest, current) =>
                              current.created_at > latest.created_at
                                ? current
                                : latest,
                            ).created_at,
                            {
                              format: "long",
                            },
                          )}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-button-info/10 border-button-info/20 rounded-lg border p-4">
                  <p className="text-secondary-text text-center text-sm">
                    This is a manual report-based system. For more comprehensive
                    dupe detection, try our{" "}
                    <Link
                      href="/dupes"
                      className="text-link hover:text-link-hover font-medium transition-colors hover:underline"
                    >
                      automated dupe checker
                    </Link>
                    .
                  </p>
                </div>

                {allItemDetails.length > 0 && (
                  <div className="space-y-4">
                    {/* Items List */}
                    <div className="space-y-2">
                      <h4 className="text-primary-text text-sm font-medium">
                        Dupe Items:
                      </h4>
                      <div className="max-h-[300px] space-y-2 overflow-y-auto">
                        {allItemDetails
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map((item, index) => {
                            // Find the most recent dupe report for this item
                            const itemDupes = results.filter(
                              (result) => result.item_id === item.id,
                            );
                            const mostRecentDupe = itemDupes.reduce(
                              (latest, current) =>
                                current.created_at > latest.created_at
                                  ? current
                                  : latest,
                            );

                            return (
                              <Link
                                key={`${item.id}-${index}`}
                                href={`/item/${encodeURIComponent(item.type)}/${encodeURIComponent(item.name)}`}
                                className="border-border-primary bg-primary-bg hover:border-border-focus flex items-center justify-between rounded-lg border p-3 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                      <Tooltip
                                        title={
                                          <TradeAdTooltip
                                            item={{
                                              id: item.id,
                                              name: item.name,
                                              type: item.type,
                                              is_seasonal:
                                                item.is_seasonal || 0,
                                              is_limited: item.is_limited || 0,
                                              cash_value: item.cash_value,
                                              duped_value: item.duped_value,
                                              trend: item.trend,
                                              tradable:
                                                typeof item.tradable ===
                                                "boolean"
                                                  ? item.tradable
                                                    ? 1
                                                    : 0
                                                  : item.tradable,
                                              base_name: item.name,
                                              is_sub: false,
                                              data: {
                                                name: item.name,
                                                type: item.type,
                                                creator: item.creator,
                                                is_seasonal: item.is_seasonal,
                                                cash_value: item.cash_value,
                                                duped_value: item.duped_value,
                                                price: item.price,
                                                is_limited: item.is_limited,
                                                duped_owners: "",
                                                notes: item.notes,
                                                demand: item.demand,
                                                trend: item.trend,
                                                description: item.description,
                                                health: item.health,
                                                tradable:
                                                  typeof item.tradable ===
                                                  "boolean"
                                                    ? item.tradable
                                                    : Boolean(item.tradable),
                                                last_updated: item.last_updated,
                                              },
                                            }}
                                          />
                                        }
                                        arrow
                                        placement="bottom"
                                        disableTouchListener
                                        slotProps={{
                                          tooltip: {
                                            sx: {
                                              backgroundColor:
                                                "var(--color-secondary-bg)",
                                              color:
                                                "var(--color-primary-text)",
                                              maxWidth: "400px",
                                              width: "auto",
                                              minWidth: "300px",
                                              "& .MuiTooltip-arrow": {
                                                color:
                                                  "var(--color-secondary-bg)",
                                              },
                                            },
                                          },
                                        }}
                                      >
                                        <span className="text-primary-text hover:text-link-hover cursor-help font-medium transition-colors">
                                          {item.name}
                                        </span>
                                      </Tooltip>
                                      <span
                                        className="text-primary-text flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"
                                        style={{
                                          borderColor: getCategoryColor(
                                            item.type,
                                          ),
                                          backgroundColor:
                                            getCategoryColor(item.type) + "20", // Add 20% opacity
                                        }}
                                      >
                                        {item.type}
                                      </span>
                                    </div>
                                    <span className="text-secondary-text text-xs">
                                      Reported{" "}
                                      {formatRelativeDate(
                                        mostRecentDupe.created_at,
                                      )}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-secondary-text text-xs">
                                  View Details
                                </div>
                              </Link>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {itemName && itemDetails && (
        <ReportDupeModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          itemName={itemName.split(" [")[0]}
          itemType={itemName.match(/\[(.*?)\]/)?.[1] || ""}
          ownerName={ownerName}
          itemId={itemDetails.id}
          isOwnerNameReadOnly={true}
        />
      )}
    </>
  );
};

export default DupeResultsModal;
