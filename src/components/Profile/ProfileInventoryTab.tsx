"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import { INVENTORY_API_SOURCE_HEADER, INVENTORY_API_URL } from "@/utils/api";
import Image from "next/image";
import { Pagination } from "@/components/ui/Pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getItemImagePath,
  isDriftItem,
  isVideoItem,
  getDriftVideoPath,
  getVideoPath,
  handleImageError,
} from "@/utils/images";
import { getCategoryColor, getCategoryIcon } from "@/utils/categoryIcons";
import { bangers } from "@/app/fonts";

interface InventoryApiItem {
  id: number | string;
  name: string;
  type: string;
  ["Original Owner"]?: string;
  ["Created At"]?: string;
}

interface InventoryApiResponse {
  user_id: string;
  trade_note: { note: string; timestamp: number } | null;
  data: InventoryApiItem[];
  duplicates: InventoryApiItem[];
}

interface InventoryItemNormalized {
  id: string;
  name: string;
  type: string;
  originalOwner: string | null;
  createdAt: string | null;
  isDuped: boolean;
  isOG: boolean;
  copyOrder: number;
  copyCount: number;
}

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const isRetryableFetchError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  if (error.name === "AbortError") return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("fetch failed") ||
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("connect") ||
    message.includes("und_err")
  );
};

const getProxyRobloxHeadshotUrl = (robloxId: string | null | undefined) => {
  const baseUrl = INVENTORY_API_URL;
  if (!baseUrl) return null;
  const trimmed = (robloxId ?? "").toString().trim();
  if (!trimmed) return null;
  return `${baseUrl}/proxy/users/${encodeURIComponent(trimmed)}/avatar-headshot`;
};

const normalizeInventoryItemId = (value: unknown): string | null => {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  return null;
};

export default function ProfileInventoryTab({
  robloxId,
  active,
}: {
  robloxId: string;
  active: boolean;
}) {
  const trimmedId = (robloxId ?? "").trim();
  const hasValidRobloxId = /^\d+$/.test(trimmedId);

  const [status, setStatus] = useState<"idle" | "loading" | "loaded" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<InventoryItemNormalized[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [tradeNote, setTradeNote] = useState<string | null>(null);
  const [ownerUsers, setOwnerUsers] = useState<
    Record<string, { name: string; displayName: string }>
  >({});

  const lastFetchedIdRef = useRef<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const ownerFetchControllerRef = useRef<AbortController | null>(null);
  const lastOwnerFetchKeyRef = useRef<string | null>(null);

  const shouldShowLoadingUi =
    active &&
    hasValidRobloxId &&
    Boolean(INVENTORY_API_URL) &&
    lastFetchedIdRef.current !== trimmedId &&
    status === "idle";
  const effectiveStatus = shouldShowLoadingUi ? "loading" : status;

  useEffect(() => {
    if (!active) {
      controllerRef.current?.abort();
      return;
    }

    if (!hasValidRobloxId) {
      setStatus("error");
      setError("This user does not have a connected Roblox account.");
      setItems([]);
      setTotalCount(0);
      return;
    }

    if (!INVENTORY_API_URL) {
      setStatus("error");
      setError(
        "Inventory API is not configured (NEXT_PUBLIC_INVENTORY_API_URL missing).",
      );
      setItems([]);
      setTotalCount(0);
      return;
    }

    if (lastFetchedIdRef.current === trimmedId) {
      return;
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    const fetchInventory = async () => {
      setStatus("loading");
      setError(null);

      try {
        const url = `${INVENTORY_API_URL}/user/inventory?id=${encodeURIComponent(trimmedId)}&nocache=false`;
        const retryStatuses = new Set([408, 425, 429, 500, 502, 503, 504]);
        const maxAttempts = 3;

        let response: Response | null = null;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          if (controller.signal.aborted) {
            throw new DOMException("Aborted", "AbortError");
          }

          try {
            response = await fetch(url, {
              method: "GET",
              headers: {
                "User-Agent": "JailbreakChangelogs-UserProfile/1.0",
                "X-Source": INVENTORY_API_SOURCE_HEADER ?? "",
              },
              cache: "no-store",
              signal: controller.signal,
            });
          } catch (err) {
            if (controller.signal.aborted) {
              throw new DOMException("Aborted", "AbortError");
            }
            if (attempt < maxAttempts - 1 && isRetryableFetchError(err)) {
              const baseDelayMs = 500 * Math.pow(2, attempt);
              const jitterMs = Math.floor(Math.random() * 250);
              await sleep(baseDelayMs + jitterMs);
              continue;
            }
            throw err;
          }

          if (
            response &&
            !response.ok &&
            retryStatuses.has(response.status) &&
            attempt < maxAttempts - 1
          ) {
            response.body?.cancel();
            const baseDelayMs = 500 * Math.pow(2, attempt);
            const jitterMs = Math.floor(Math.random() * 250);
            await sleep(baseDelayMs + jitterMs);
            response = null;
            continue;
          }

          break;
        }

        if (!response) {
          throw new Error("Failed to load inventory (no response)");
        }

        const payload = (await response.json()) as unknown;
        if (!response.ok) {
          const message =
            (payload &&
            typeof payload === "object" &&
            "message" in payload &&
            typeof (payload as { message?: unknown }).message === "string"
              ? (payload as { message: string }).message
              : null) || `Failed to load inventory (${response.status})`;
          throw new Error(message);
        }

        const data =
          payload && typeof payload === "object" && !Array.isArray(payload)
            ? (payload as InventoryApiResponse)
            : null;
        const rawData = Array.isArray(data?.data) ? data.data : [];
        const rawDupes = Array.isArray(data?.duplicates) ? data.duplicates : [];

        const out: InventoryItemNormalized[] = [];
        const combinedCount = rawData.length + rawDupes.length;

        const idCounts = new Map<string, number>();
        const bumpCount = (it: InventoryApiItem) => {
          const idKey = normalizeInventoryItemId(it?.id);
          if (!idKey) return;
          idCounts.set(idKey, (idCounts.get(idKey) || 0) + 1);
        };
        rawData.forEach(bumpCount);
        rawDupes.forEach(bumpCount);

        const idSeen = new Map<string, number>();

        const pushItem = (it: InventoryApiItem, isDuped: boolean) => {
          const idKey = normalizeInventoryItemId(it?.id);
          if (!idKey) return;
          const nextOrder = (idSeen.get(idKey) || 0) + 1;
          idSeen.set(idKey, nextOrder);
          const copyCount = idCounts.get(idKey) || 1;
          const originalOwner =
            typeof it["Original Owner"] === "string" &&
            it["Original Owner"].trim()
              ? it["Original Owner"].trim()
              : null;
          const createdAt =
            typeof it["Created At"] === "string" && it["Created At"].trim()
              ? it["Created At"].trim()
              : null;
          out.push({
            id: idKey,
            name: it.name,
            type: it.type,
            originalOwner,
            createdAt,
            isDuped,
            isOG: Boolean(originalOwner && originalOwner === trimmedId),
            copyOrder: nextOrder,
            copyCount,
          });
        };

        rawData.forEach((it) => {
          pushItem(it, false);
        });
        rawDupes.forEach((it) => {
          pushItem(it, true);
        });

        setItems(out);
        setTotalCount(combinedCount);
        setTradeNote(data?.trade_note?.note?.trim() || null);
        setStatus("loaded");
        lastFetchedIdRef.current = trimmedId;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          // StrictMode can replay effects and trigger aborts; don't cache failed/aborted attempts.
          lastFetchedIdRef.current = null;
          setStatus("idle");
          return;
        }
        setStatus("error");
        setError(
          err instanceof Error ? err.message : "Failed to load inventory",
        );
        setItems([]);
        setTotalCount(0);
        setTradeNote(null);
        lastFetchedIdRef.current = null;
      }
    };

    void fetchInventory();
  }, [active, hasValidRobloxId, trimmedId]);

  useEffect(() => {
    if (!active) return;
    if (status !== "loaded") return;
    if (!INVENTORY_API_URL) return;
    if (items.length === 0) return;

    const userIds = Array.from(
      new Set(
        items
          .map((item) => (item.originalOwner || "").trim())
          .filter((id) => /^\d+$/.test(id))
          .concat(trimmedId),
      ),
    );

    const key = userIds.sort().join(",");
    if (lastOwnerFetchKeyRef.current === key) return;
    lastOwnerFetchKeyRef.current = key;

    ownerFetchControllerRef.current?.abort();
    const controller = new AbortController();
    ownerFetchControllerRef.current = controller;

    const fetchOwners = async () => {
      try {
        const response = await fetch(`${INVENTORY_API_URL}/proxy/users/v2`, {
          method: "POST",
          headers: {
            "User-Agent": "JailbreakChangelogs-UserProfile/1.0",
            "X-Source": INVENTORY_API_SOURCE_HEADER ?? "",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userIds }),
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) return;

        const data = (await response.json()) as unknown;
        if (!data || typeof data !== "object" || Array.isArray(data)) return;

        const next: Record<string, { name: string; displayName: string }> = {};
        Object.values(data as Record<string, unknown>).forEach((user) => {
          if (!user || typeof user !== "object") return;
          const record = user as Record<string, unknown>;
          const id = record.id;
          const name = typeof record.name === "string" ? record.name : "";
          const displayName =
            typeof record.displayName === "string" ? record.displayName : "";
          if (typeof id === "number" || typeof id === "string") {
            const userId = String(id);
            next[userId] = {
              name: name || userId,
              displayName: displayName || name || userId,
            };
          }
        });

        setOwnerUsers(next);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    };

    void fetchOwners();

    return () => controller.abort();
  }, [active, items, status, trimmedId]);

  const hasItems = status === "loaded" && items.length > 0;

  const availableTypes = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.type && item.type.trim()) set.add(item.type.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      if (!query) return true;
      return (
        item.name.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query)
      );
    });
  }, [items, searchQuery, typeFilter]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, typeFilter]);

  const header = useMemo(() => {
    if (!hasValidRobloxId) return null;
    const hasFilters = Boolean(searchQuery.trim()) || typeFilter !== "all";
    const filterLabelParts: string[] = [];
    if (searchQuery.trim()) {
      filterLabelParts.push(`Results for “${searchQuery.trim()}”`);
    }
    if (typeFilter !== "all") {
      filterLabelParts.push(typeFilter);
    }
    const filterLabel =
      filterLabelParts.length > 0 ? `${filterLabelParts.join(" • ")}: ` : "";

    return (
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <p className="text-secondary-text text-sm">
            {effectiveStatus === "loading" ? (
              <span className="inline-flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Loading inventory items...</span>
              </span>
            ) : status === "loaded" ? (
              hasFilters ? (
                `${filterLabel}${filteredItems.length} of ${totalCount}`
              ) : (
                `Total Items: ${totalCount}`
              )
            ) : (
              "Inventory items"
            )}
          </p>
        </div>
        <Button asChild size="sm" variant="secondary">
          <Link
            href={`/inventories/${encodeURIComponent(trimmedId)}`}
            prefetch={false}
          >
            View Full Inventory
          </Link>
        </Button>
      </div>
    );
  }, [
    effectiveStatus,
    filteredItems.length,
    hasValidRobloxId,
    searchQuery,
    status,
    trimmedId,
    totalCount,
    typeFilter,
  ]);

  const itemsPerPage = 16;
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const displayedItems = filteredItems.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage,
  );
  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setPage(value);
  };

  return (
    <div className="mt-6 px-4 pb-4 sm:px-6">
      {header}

      {status === "loaded" && (
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1 md:min-w-[280px]">
            <input
              type="text"
              placeholder="Search inventory items (e.g., Torpedo)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              maxLength={80}
              className="border-border-card bg-secondary-bg text-primary-text placeholder-secondary-text focus:border-button-info h-11 w-full rounded-lg border px-3 pr-9 pl-9 text-sm transition-all duration-300 focus:outline-none"
            />
            <Icon
              icon="heroicons:magnifying-glass"
              className="text-secondary-text absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-secondary-text hover:text-primary-text absolute top-1/2 right-2 h-6 w-6 -translate-y-1/2 cursor-pointer"
                aria-label="Clear search"
              >
                <Icon icon="heroicons:x-mark" />
              </button>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="border-border-card bg-secondary-bg text-primary-text hover:bg-quaternary-bg inline-flex h-11 w-full items-center justify-between gap-2 rounded-lg border px-3 text-sm transition-all duration-200 focus:outline-none md:w-[200px] md:shrink-0 lg:w-[220px]"
                aria-label="Filter by type"
              >
                <span className="truncate">
                  {typeFilter === "all" ? "All Types" : typeFilter}
                </span>
                <Icon
                  icon="heroicons:chevron-down"
                  className="text-secondary-text h-5 w-5"
                  inline={true}
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="border-border-card bg-secondary-bg text-primary-text scrollbar-thin w-[var(--radix-popper-anchor-width)] min-w-[14rem] overflow-x-hidden overflow-y-auto rounded-xl border p-1 shadow-lg"
            >
              <DropdownMenuRadioGroup
                value={typeFilter}
                onValueChange={(value) => setTypeFilter(value)}
              >
                <DropdownMenuRadioItem value="all">
                  All Types
                </DropdownMenuRadioItem>
                {availableTypes.map((t) => (
                  <DropdownMenuRadioItem key={t} value={t}>
                    {t}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {status === "error" && (
        <div className="border-border-card bg-secondary-bg rounded-lg border p-6 text-center">
          <p className="text-secondary-text text-sm">
            {error || "Failed to load inventory."}
          </p>
        </div>
      )}

      {status === "loaded" && !hasItems && (
        <div className="border-border-card bg-secondary-bg rounded-lg border p-6 text-center">
          <Icon
            icon="heroicons:cube"
            className="text-secondary-text mx-auto mb-3 h-10 w-10"
          />
          <p className="text-secondary-text text-sm">
            No inventory items found.
          </p>
        </div>
      )}

      {status === "loaded" &&
        filteredItems.length === 0 &&
        items.length > 0 && (
          <p className="text-secondary-text mt-10 pb-10 text-center text-sm">
            No items match your search.
          </p>
        )}

      {hasItems && filteredItems.length > 0 && (
        <>
          {tradeNote && (
            <div className="border-border-card bg-tertiary-bg mb-4 rounded-lg border p-3">
              <p className="text-secondary-text mb-1 text-[10px] tracking-wide uppercase">
                Last Trade Note
              </p>
              <p className="text-primary-text text-sm italic">
                &quot;{tradeNote}&quot;
              </p>
            </div>
          )}
          {totalPages > 1 && (
            <div className="mb-4 flex justify-center">
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
              />
            </div>
          )}

          <div className="mb-8 grid grid-cols-1 gap-4 min-[375px]:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayedItems.map((item) => {
              const categoryColor = getCategoryColor(item.type);
              const categoryIcon = getCategoryIcon(item.type);
              const itemHref = `/item/${encodeURIComponent(item.type.toLowerCase())}/${encodeURIComponent(item.name)}`;

              const imgSrc = getItemImagePath(item.type, item.name, true);
              const isVideo = isVideoItem(item.name);
              const isDrift = isDriftItem(item.type);
              const ownerId = item.isOG ? trimmedId : item.originalOwner;
              const ownerAvatarSrc = getProxyRobloxHeadshotUrl(ownerId);
              const ownerLabel =
                (ownerId && ownerUsers[ownerId]?.displayName) ||
                (ownerId && ownerUsers[ownerId]?.name) ||
                ownerId;

              return (
                <div
                  key={`${item.id}-${item.copyOrder}`}
                  className={`text-primary-text relative flex min-h-[400px] flex-col rounded-lg border p-3 transition-all duration-200 ${
                    item.isOG
                      ? "hover:shadow-card-shadow border-[#FFD700] bg-[#FFD700]/10 hover:border-[#FFD700]"
                      : "border-border-card bg-tertiary-bg"
                  }`}
                >
                  {item.copyCount > 1 && (
                    <div className="bg-button-danger text-form-button-text absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shadow-lg">
                      #{item.copyOrder}
                    </div>
                  )}
                  <div className="mb-4 text-left">
                    <h2
                      className={`${bangers.className} text-primary-text mb-1 truncate text-2xl tracking-wide`}
                    >
                      <Link
                        href={itemHref}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-link-hover block truncate transition-colors"
                        prefetch={false}
                      >
                        {item.name}
                      </Link>
                    </h2>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-primary-text bg-tertiary-bg/40 flex h-6 items-center gap-1.5 rounded-lg border px-2.5 text-xs leading-none font-medium shadow-2xl backdrop-blur-xl"
                        style={{
                          borderColor: categoryColor,
                        }}
                      >
                        {categoryIcon ? (
                          <categoryIcon.Icon
                            className="h-3 w-3"
                            style={{ color: categoryColor }}
                          />
                        ) : null}
                        {item.type}
                      </span>
                    </div>
                  </div>

                  <div className="relative mb-3 h-48 w-full overflow-hidden rounded-lg">
                    {isVideo ? (
                      <video
                        src={getVideoPath(item.type, item.name)}
                        className="h-full w-full object-cover"
                        muted
                        playsInline
                        loop
                        autoPlay
                      />
                    ) : isDrift ? (
                      <div className="relative h-full w-full">
                        <Image
                          src={imgSrc}
                          alt={item.name}
                          fill
                          className="object-cover"
                          onError={handleImageError}
                        />
                        <video
                          src={getDriftVideoPath(item.name, true)}
                          className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 hover:opacity-100"
                          muted
                          playsInline
                          loop
                        />
                      </div>
                    ) : (
                      <Image
                        src={imgSrc}
                        alt={item.name}
                        fill
                        className="object-cover"
                        onError={handleImageError}
                      />
                    )}
                  </div>

                  <div className="flex flex-1 flex-col justify-center space-y-2 text-center">
                    <div>
                      <div className="text-secondary-text text-sm">
                        ORIGINAL OWNER
                      </div>
                      <div className="text-xl font-bold">
                        {ownerId ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="border-border-card bg-tertiary-bg relative h-8 w-8 shrink-0 overflow-hidden rounded-full border">
                              {ownerAvatarSrc ? (
                                <Image
                                  src={ownerAvatarSrc}
                                  alt="Owner Avatar"
                                  width={32}
                                  height={32}
                                  className="rounded-full"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = "none";
                                    const parent = target.parentElement;
                                    if (
                                      parent &&
                                      !parent.querySelector("svg")
                                    ) {
                                      const defaultAvatar =
                                        document.createElement("div");
                                      defaultAvatar.className =
                                        "flex h-full w-full items-center justify-center";
                                      defaultAvatar.innerHTML = `<svg class=\"h-5 w-5 text-tertiary-text\" fill=\"currentColor\" viewBox=\"0 0 20 20\"><path fill-rule=\"evenodd\" d=\"M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z\" clip-rule=\"evenodd\" /></svg>`;
                                      parent.appendChild(defaultAvatar);
                                    }
                                  }}
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <Icon
                                    icon="heroicons:user"
                                    className="text-tertiary-text h-5 w-5"
                                  />
                                </div>
                              )}
                            </div>
                            <a
                              href={`https://www.roblox.com/users/${ownerId}/profile`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-link hover:text-link-hover text-center wrap-break-word transition-colors hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {ownerLabel || ownerId}
                            </a>
                          </div>
                        ) : (
                          <span className="text-secondary-text text-sm">
                            Unknown
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-secondary-text text-sm">
                        CREATED ON
                      </div>
                      <div className="text-primary-text text-xl font-bold">
                        {item.createdAt || "N/A"}
                      </div>
                    </div>
                  </div>

                  <div className="border-secondary-text mt-3 min-h-[40px] border-t pt-3">
                    {item.isDuped ? (
                      <div className="flex flex-col items-center gap-1 text-center text-xs">
                        <span className="text-secondary-text">
                          This item may be duped.
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
