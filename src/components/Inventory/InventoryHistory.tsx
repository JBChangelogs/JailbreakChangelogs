"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import type {
  HistoricalInventoryItem,
  InventoryHistoryData,
  ItemOwnerData,
} from "@/app/inventories/types";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Icon } from "@/components/ui/IconWrapper";
import InventoryItemsSkeleton from "./InventoryItemsSkeleton";
import InventoryHistoryTip from "./InventoryHistoryTip";
import InventoryItemAppearance from "./InventoryItemAppearance";
import InventoryMarketSummary from "./InventoryMarketSummary";
import { useInventoryScanHistory } from "@/hooks/useInventoryScanHistory";
import { useCatalogValues } from "@/hooks/usePartialItems";
import InventoryListControls from "./InventoryListControls";
import { Pagination } from "@/components/ui/Pagination";
import { matchesTextSearch } from "@/utils/helpers/itemSearch";
import TradeHistoryModal, {
  TradeAvatarImage,
} from "@/components/Modals/TradeHistoryModal";
import { useBatchUserData } from "@/hooks/useBatchUserData";
import {
  INVENTORY_API_URL,
  INVENTORY_API_SOURCE_HEADER,
} from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";

const INVENTORY_HISTORY_START_DATE = "2026-10-31";

const formatUtc = (timestamp: number) =>
  new Date(timestamp * 1000)
    .toISOString()
    .replace("T", " ")
    .replace(".000Z", " UTC");

async function fetchHistoryData<T>(
  path: string,
  signal: AbortSignal,
): Promise<T | null> {
  const { url, headers } = buildApiFetchRequest(INVENTORY_API_URL, path);
  const response = await fetch(url, {
    headers: { ...headers, "X-Source": INVENTORY_API_SOURCE_HEADER ?? "" },
    signal: AbortSignal.any([signal, AbortSignal.timeout(15_000)]),
    cache: "no-store",
  });
  if (response.status === 404) return null;
  if (response.status === 400)
    throw new Error("Invalid date. Choose a date in YYYY-MM-DD format.");
  if (!response.ok) throw new Error("Unable to load data. Please try again.");
  return response.json();
}

function CurrentOwner({ item }: { item: HistoricalInventoryItem }) {
  const [attempt, setAttempt] = useState(1);
  const [data, setData] = useState<ItemOwnerData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const { robloxUsers } = useBatchUserData(
    data?.owners.map((owner) => owner.user_id) ?? [],
  );

  useEffect(() => {
    if (!attempt) return;
    const controller = new AbortController();
    const params = new URLSearchParams({
      id: item.item_id,
      branch_id: item.branch_id,
    });
    void fetchHistoryData<ItemOwnerData>(
      `/item/owner?${params}`,
      controller.signal,
    )
      .then((result) => {
        if (controller.signal.aborted) return;
        if (!result || !Array.isArray(result.owners) || !result.owners.length)
          throw new Error("This copy could not be found.");
        setData(result);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to find the owner.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [attempt, item.item_id, item.branch_id]);

  return (
    <div className="space-y-3">
      <h3 className="text-primary-text font-semibold">Current owner</h3>
      {loading && (
        <p role="status" className="text-secondary-text text-sm">
          Finding current owner…
        </p>
      )}
      {error && (
        <div role="alert">
          <p className="text-status-error text-sm">{error}</p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-2"
            onClick={() => {
              setError("");
              setData(null);
              setLoading(true);
              setAttempt((value) => value + 1);
            }}
          >
            Try again
          </Button>
        </div>
      )}
      {data && (
        <div className="space-y-2 text-sm" aria-live="polite">
          {data.duplicated_since && (
            <p>Duplicated since this scan. Known owners of each copy:</p>
          )}
          {(data.duplicated_since ? data.owners : data.owners.slice(0, 1)).map(
            (owner, index) => {
              const user = robloxUsers[owner.user_id];
              const username = user?.name || user?.username;
              return (
                <div key={`${owner.user_id}-${index}`}>
                  <Link
                    className="group flex items-center gap-3"
                    href={`/inventories/${encodeURIComponent(owner.user_id)}`}
                  >
                    <TradeAvatarImage userId={owner.user_id} />
                    <span className="min-w-0">
                      <span className="text-link block truncate font-semibold group-hover:underline">
                        {user?.displayName || username || owner.user_id}
                      </span>
                      {username && (
                        <span className="text-secondary-text block truncate">
                          @{username}
                        </span>
                      )}
                    </span>
                  </Link>
                  <p className="text-secondary-text">
                    {owner.still_held === false
                      ? owner.left_at !== null
                        ? `traded away since ${formatUtc(owner.left_at)}`
                        : "Traded away; date unknown"
                      : owner.still_held === true
                        ? "Still held at their latest scan"
                        : "Current ownership unknown"}
                  </p>
                  {owner.last_seen !== null && (
                    <p className="text-secondary-text">
                      Last seen {formatUtc(owner.last_seen)}
                    </p>
                  )}
                </div>
              );
            },
          )}
        </div>
      )}
    </div>
  );
}

export default function InventoryHistory({
  userId,
  children,
  preview,
  onDateChange,
  isOwnInventory = false,
}: {
  userId: string;
  children?: ReactNode;
  preview?: ReactNode;
  onDateChange?: (date: string) => void;
  isOwnInventory?: boolean;
}) {
  const [date, setDate] = useState("");
  const dateTriggerRef = useRef<HTMLButtonElement>(null);
  const restoreDateFocusRef = useRef(false);
  const catalogQuery = useCatalogValues(Boolean(date));
  const catalogById = new Map(
    (catalogQuery.data ?? []).map((item) => [item.id, item]),
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState("created-desc");
  const [page, setPage] = useState(1);
  const [ownerPopover, setOwnerPopover] = useState<string | null>(null);
  const [historyItem, setHistoryItem] =
    useState<HistoricalInventoryItem | null>(null);
  const changeDate = (nextDate: string) => {
    setDate(nextDate);
    setResult(null);
    setHistoryItem(null);
    setOwnerPopover(null);
    setSearchTerm("");
    setSelectedCategories([]);
    setPage(1);
    onDateChange?.(nextDate);
  };
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const todayUtc = new Date().toISOString().slice(0, 10);
  const scanHistoryQuery = useInventoryScanHistory(userId, isDatePickerOpen);
  const scanDates = new Set(
    (scanHistoryQuery.data ?? [])
      .map((scan) =>
        new Date(scan.created_at * 1000).toISOString().slice(0, 10),
      )
      // Inventory history tracking began on October 31, 2026 UTC.
      .filter((scanDate) => scanDate >= INVENTORY_HISTORY_START_DATE),
  );
  const [result, setResult] = useState<{
    date: string;
    data?: InventoryHistoryData;
    error?: string;
    notFound?: boolean;
  } | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!date) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ id: userId, date });
    void fetchHistoryData<InventoryHistoryData>(
      `/user/inventory/history?${params}`,
      controller.signal,
    )
      .then((data) => {
        if (controller.signal.aborted) return;
        if (data === null) {
          setResult({ date, notFound: true });
          return;
        }
        if (!Array.isArray(data.items) || !Number.isFinite(data.as_of))
          throw new Error("Invalid inventory history response.");
        setResult({ date, data });
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted)
          setResult({
            date,
            error:
              cause instanceof Error
                ? cause.message
                : "Unable to load inventory history.",
          });
      });
    return () => controller.abort();
  }, [date, userId, attempt]);

  const selected = result?.date === date ? result : null;
  const historicalItems = selected?.data?.items ?? [];
  const availableCategories = [
    ...new Set(historicalItems.map((item) => item.category_title)),
  ].sort();
  const filteredItems = historicalItems
    .filter(
      (item) =>
        matchesTextSearch([item.title, item.category_title], searchTerm) &&
        (!selectedCategories.length ||
          selectedCategories.includes(item.category_title)),
    )
    .sort((a, b) => {
      if (sortOrder === "alpha-asc") return a.title.localeCompare(b.title);
      if (sortOrder === "alpha-desc") return b.title.localeCompare(a.title);
      return sortOrder === "created-asc"
        ? a.held_since - b.held_since
        : b.held_since - a.held_since;
    });
  const totalPages = Math.ceil(filteredItems.length / 16);
  const currentPage = Math.min(page, Math.max(1, totalPages));
  const pagination = totalPages > 1 && (
    <div className="my-4 flex justify-center">
      <Pagination
        count={totalPages}
        page={currentPage}
        onChange={(_, value) => setPage(value)}
      />
    </div>
  );

  return (
    <div className="space-y-4">
      {preview}
      <section className="border-border-card bg-secondary-bg min-h-dvh rounded-lg border p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-primary-text text-xl font-semibold">
            Inventory Items
          </h2>
          <div className="flex w-full flex-col items-start gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex items-center gap-2">
              <span
                id="inventory-date-label"
                className="text-secondary-text text-sm"
              >
                Viewing date (UTC)
              </span>
              <Popover
                open={isDatePickerOpen}
                onOpenChange={setIsDatePickerOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    ref={dateTriggerRef}
                    type="button"
                    variant="ghost"
                    aria-label="Viewing date (UTC)"
                    aria-describedby="inventory-date-label"
                    style={{ backgroundColor: "var(--color-tertiary-bg)" }}
                    className="border-border-card bg-tertiary-bg text-primary-text hover:border-border-focus hover:bg-tertiary-bg! active:bg-tertiary-bg! h-10 justify-between gap-3 rounded-md border py-2 font-normal"
                  >
                    <span>
                      {date
                        ? format(new Date(`${date}T00:00:00`), "MMM d, yyyy")
                        : "Latest scan"}
                    </span>
                    <Icon icon="heroicons:chevron-down" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  collisionPadding={16}
                  onCloseAutoFocus={(event) => {
                    if (!restoreDateFocusRef.current) return;
                    event.preventDefault();
                    restoreDateFocusRef.current = false;
                    dateTriggerRef.current?.focus({ preventScroll: true });
                  }}
                  className="border-border-card bg-secondary-bg w-auto p-0"
                >
                  <Calendar
                    mode="single"
                    startMonth={
                      new Date(`${INVENTORY_HISTORY_START_DATE}T00:00:00`)
                    }
                    endMonth={new Date(`${todayUtc}T00:00:00`)}
                    modifiers={{
                      scanned: (day) =>
                        scanDates.has(format(day, "yyyy-MM-dd")),
                    }}
                    modifiersClassNames={{
                      scanned:
                        "[&_button]:relative [&_button]:after:absolute [&_button]:after:bottom-0.5 [&_button]:after:left-1/2 [&_button]:after:size-1 [&_button]:after:-translate-x-1/2 [&_button]:after:rounded-full [&_button]:after:bg-button-info [&_button]:after:content-[''] [&_button[data-selected-single=true]]:after:bg-form-button-text",
                    }}
                    selected={date ? new Date(`${date}T00:00:00`) : undefined}
                    defaultMonth={
                      date ? new Date(`${date}T00:00:00`) : undefined
                    }
                    onSelect={(day) => {
                      if (!day) return;
                      restoreDateFocusRef.current = true;
                      changeDate(format(day, "yyyy-MM-dd"));
                      setIsDatePickerOpen(false);
                    }}
                    disabled={(day) => {
                      const dayString = format(day, "yyyy-MM-dd");
                      return (
                        dayString < INVENTORY_HISTORY_START_DATE ||
                        dayString > todayUtc
                      );
                    }}
                    initialFocus
                  />
                  <div
                    className="text-secondary-text max-w-64 px-3 pb-2 text-xs"
                    aria-live="polite"
                  >
                    {scanHistoryQuery.isLoading ? (
                      "Loading scan dates…"
                    ) : scanHistoryQuery.isError ? (
                      <>
                        Scan dates could not be loaded.{" "}
                        <button
                          type="button"
                          className="text-link underline"
                          onClick={() => void scanHistoryQuery.refetch()}
                        >
                          Try again
                        </button>
                      </>
                    ) : (
                      "Dots mark scans · Latest 1,000"
                    )}
                  </div>
                  <p className="text-secondary-text max-w-64 px-3 pb-3 text-xs">
                    History tracking since Oct 31, 2026 · UTC
                  </p>
                </PopoverContent>
              </Popover>
            </div>
            <InventoryHistoryTip
              isOwnInventory={isOwnInventory}
              anchorRef={dateTriggerRef}
              datePickerOpen={isDatePickerOpen}
              onOpenDatePicker={() => setIsDatePickerOpen(true)}
            />
            {date && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => changeDate("")}
              >
                Latest scan
              </Button>
            )}
          </div>
        </div>
        {!date ? (
          children
        ) : (
          <div aria-live="polite">
            <div className="mb-4">
              <InventoryListControls
                searchTerm={searchTerm}
                setSearchTerm={(value) => {
                  setSearchTerm(value);
                  setPage(1);
                }}
                selectedCategories={selectedCategories}
                setSelectedCategories={(value) => {
                  setSelectedCategories(value);
                  setPage(1);
                }}
                availableCategories={availableCategories}
                sortOrder={sortOrder}
                setSortOrder={(value) => {
                  setSortOrder(value);
                  setPage(1);
                }}
                sortGroups={[
                  {
                    label: "Date held",
                    options: [
                      { value: "created-desc", label: "Newest First" },
                      { value: "created-asc", label: "Oldest First" },
                    ],
                  },
                  {
                    label: "Name",
                    options: [
                      { value: "alpha-asc", label: "Name: A–Z" },
                      { value: "alpha-desc", label: "Name: Z–A" },
                    ],
                  },
                ]}
              />
            </div>
            {!selected && <InventoryItemsSkeleton />}
            {selected?.notFound && (
              <div className="text-secondary-text py-12 text-center">
                <p className="text-primary-text font-medium">
                  No recorded inventory available as of {date}.
                </p>
                <p className="mt-2 text-sm">
                  Choose a later date or return to the latest inventory. History
                  starts with scans after tracking began.
                </p>
              </div>
            )}
            {selected?.error && (
              <div role="alert">
                <p className="text-status-error">{selected.error}</p>
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-2"
                  onClick={() => {
                    setResult(null);
                    setAttempt((value) => value + 1);
                  }}
                >
                  Try again
                </Button>
              </div>
            )}
            {selected?.data && (
              <>
                <h2 className="text-primary-text text-lg font-semibold">
                  Inventory as of {formatUtc(selected.data.as_of)}
                </h2>
                <p className="text-secondary-text mt-2">
                  {searchTerm || selectedCategories.length
                    ? `Found ${filteredItems.length} items`
                    : `Total Items: ${historicalItems.length}`}
                </p>
                {pagination}
                {!historicalItems.length && (
                  <p className="text-secondary-text mt-3">
                    No items in this inventory.
                  </p>
                )}
                {historicalItems.length > 0 && !filteredItems.length && (
                  <p className="text-secondary-text py-8 text-center">
                    No items found matching your criteria.
                  </p>
                )}
                <div className="mt-4 mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
                  {filteredItems
                    .slice((currentPage - 1) * 16, currentPage * 16)
                    .map((item) => {
                      const ownerKey = `${item.item_id}-${item.branch_id}`;
                      const ownerExpanded = ownerPopover === ownerKey;
                      return (
                        <article
                          key={`${date}-${item.item_id}-${item.branch_id}`}
                          className="text-primary-text border-border-card bg-tertiary-bg relative flex flex-col rounded-lg border p-3"
                        >
                          <InventoryItemAppearance
                            title={item.title}
                            categoryTitle={item.category_title}
                          />
                          <InventoryMarketSummary
                            data={catalogById.get(item.catalog_item_id)}
                          />
                          <div className="mt-auto space-y-3 pt-3">
                            <p className="text-secondary-text text-sm">
                              Held since {formatUtc(item.held_since)}
                            </p>
                            <div className="flex flex-wrap justify-end gap-2">
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => setHistoryItem(item)}
                              >
                                History
                              </Button>
                              <Popover
                                open={ownerExpanded}
                                onOpenChange={(open) =>
                                  setOwnerPopover(open ? ownerKey : null)
                                }
                              >
                                <PopoverTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                  >
                                    Current owner
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                  align="end"
                                  collisionPadding={16}
                                  aria-label={`Current owner of ${item.title}`}
                                  className="bg-secondary-bg max-h-[min(24rem,var(--radix-popover-content-available-height))] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto p-4"
                                >
                                  {ownerExpanded && (
                                    <CurrentOwner item={item} />
                                  )}
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                </div>
                {historyItem && (
                  <TradeHistoryModal
                    isOpen
                    onClose={() => setHistoryItem(null)}
                    item={{
                      title: historyItem.title,
                      categoryTitle: historyItem.category_title,
                      id: historyItem.item_id,
                    }}
                    transfers={historyItem.history}
                    historyDate={date}
                  >
                    <p className="text-secondary-text mt-4 text-sm">
                      Held since {formatUtc(historyItem.held_since)}
                    </p>
                  </TradeHistoryModal>
                )}
                {pagination}
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
