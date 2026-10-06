"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import { INVENTORY_API_URL } from "@/utils/api/api";
import {
  InventoryRequestError,
  userInventoryQueryOptions,
} from "@/utils/api/userInventoryQuery";
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
} from "@/utils/ui/images";
import { getCategoryColor, getCategoryIcon } from "@/utils/items/categoryIcons";
import { matchesTextSearch } from "@/utils/helpers/itemSearch";
import { bangers } from "@/app/fonts";
import { useBatchUserData } from "@/hooks/useBatchUserData";
import { useQuery } from "@tanstack/react-query";
import { useCatalogValues } from "@/hooks/usePartialItems";
import { unlockLevel } from "@/utils/items/season";
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

const EMPTY_ITEMS: InventoryItemNormalized[] = [];

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
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const inventoryQuery = useQuery({
    ...userInventoryQueryOptions(trimmedId),
    enabled: active && hasValidRobloxId && Boolean(INVENTORY_API_URL),
    refetchOnWindowFocus: false,
  });
  const normalizedInventory = useMemo(() => {
    if (inventoryQuery.data === undefined) return null;
    const payload = inventoryQuery.data;
    const data =
      payload && typeof payload === "object" && !Array.isArray(payload)
        ? (payload as InventoryApiResponse)
        : null;
    const rawData = Array.isArray(data?.data) ? data.data : [];
    const rawDupes = Array.isArray(data?.duplicates) ? data.duplicates : [];
    const out: InventoryItemNormalized[] = [];
    const idCounts = new Map<string, number>();
    const bumpCount = (item: InventoryApiItem) => {
      const idKey = normalizeInventoryItemId(item?.id);
      if (idKey) idCounts.set(idKey, (idCounts.get(idKey) || 0) + 1);
    };
    rawData.forEach(bumpCount);
    rawDupes.forEach(bumpCount);
    const idSeen = new Map<string, number>();
    const pushItem = (item: InventoryApiItem, isDuped: boolean) => {
      const idKey = normalizeInventoryItemId(item?.id);
      if (!idKey) return;
      const nextOrder = (idSeen.get(idKey) || 0) + 1;
      idSeen.set(idKey, nextOrder);
      const originalOwner =
        typeof item["Original Owner"] === "string" &&
        item["Original Owner"].trim()
          ? item["Original Owner"].trim()
          : null;
      const createdAt =
        typeof item["Created At"] === "string" && item["Created At"].trim()
          ? item["Created At"].trim()
          : null;
      out.push({
        id: idKey,
        name: item.name,
        type: item.type,
        originalOwner,
        createdAt,
        isDuped,
        isOG: originalOwner === trimmedId,
        copyOrder: nextOrder,
        copyCount: idCounts.get(idKey) || 1,
      });
    };
    rawData.forEach((item) => pushItem(item, false));
    rawDupes.forEach((item) => pushItem(item, true));
    return {
      items: out,
      totalCount: rawData.length + rawDupes.length,
      tradeNote: data?.trade_note?.note?.trim() || null,
    };
  }, [inventoryQuery.data, trimmedId]);
  const items = normalizedInventory?.items ?? EMPTY_ITEMS;
  const totalCount = normalizedInventory?.totalCount ?? 0;
  const tradeNote = normalizedInventory?.tradeNote ?? null;
  const status =
    !hasValidRobloxId || !INVENTORY_API_URL
      ? "error"
      : inventoryQuery.data !== undefined
        ? "loaded"
        : inventoryQuery.isError
          ? "error"
          : active
            ? "loading"
            : "idle";
  const effectiveStatus = status;
  const error = !hasValidRobloxId
    ? "This user does not have a connected Roblox account."
    : !INVENTORY_API_URL
      ? "Inventory API is not configured (NEXT_PUBLIC_INVENTORY_API_URL missing)."
      : (inventoryQuery.error?.message ?? null);
  const isNotFound =
    inventoryQuery.error instanceof InventoryRequestError &&
    inventoryQuery.error.status === 404;

  const ownerIds = useMemo(
    () =>
      Array.from(
        new Set(
          items
            .map((item) => (item.originalOwner || "").trim())
            .filter((id) => /^\d+$/.test(id))
            .concat(trimmedId),
        ),
      ),
    [items, trimmedId],
  );
  const { robloxUsers: ownerUsers } = useBatchUserData(ownerIds, {
    enabled: active && status === "loaded" && items.length > 0,
  });

  const hasItems = status === "loaded" && items.length > 0;

  const availableTypes = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.type && item.type.trim()) set.add(item.type.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      return matchesTextSearch([item.name, item.type], searchQuery);
    });
  }, [items, searchQuery, typeFilter]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, typeFilter]);

  const header = useMemo(() => {
    if (!hasValidRobloxId) return null;
    if (status === "error") return null;
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
              <span className="bg-quaternary-bg inline-block h-4 w-40 animate-pulse rounded" />
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
        <Button asChild size="sm">
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

  const itemsPerPage = 18;
  const catalogQuery = useCatalogValues();
  const catalogValuesById = useMemo(
    () => new Map(catalogQuery.data?.map((item) => [String(item.id), item])),
    [catalogQuery.data],
  );
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

      {effectiveStatus === "loading" && (
        <div className="animate-pulse">
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 18 }).map((_, i) => (
              <div
                key={i}
                className="border-border-card bg-tertiary-bg flex min-h-100 flex-col rounded-lg border p-3"
              >
                <div className="bg-quaternary-bg mb-4 h-7 w-3/4 rounded" />
                <div className="bg-quaternary-bg mb-3 h-5 w-20 rounded-md" />
                <div className="bg-quaternary-bg flex-1 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      )}

      {status === "loaded" && (
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1 md:min-w-70">
            <input
              type="text"
              placeholder="Search inventory items (e.g., Torpedo)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              maxLength={80}
              className="border-border-card bg-tertiary-bg text-primary-text placeholder-secondary-text focus:border-button-info h-11 w-full rounded-lg border px-3 pr-9 pl-9 text-sm transition-all duration-300 focus:outline-none"
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
                className="border-border-card bg-tertiary-bg text-primary-text hover:bg-quaternary-bg inline-flex h-11 w-full items-center justify-between gap-2 rounded-lg border px-3 text-sm transition-all duration-200 focus:outline-none md:w-50 md:shrink-0 lg:w-55"
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
              className="border-border-card bg-secondary-bg text-primary-text w-(--radix-popper-anchor-width) min-w-56 scrollbar-thin overflow-x-hidden overflow-y-auto rounded-xl border p-1 shadow-lg"
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
        <div className="py-6 text-center">
          <Image
            src="https://assets.jailbreakchangelogs.com/assets/images/404.svg"
            alt="Failed to load inventory"
            width={160}
            height={128}
            className="mx-auto mb-4"
          />
          <p className="text-primary-text mb-1 font-semibold">
            {isNotFound ? "Inventory Not Found" : "Failed to Load Inventory"}
          </p>
          <p className="text-secondary-text mx-auto mb-6 max-w-sm text-sm leading-relaxed">
            {isNotFound
              ? "This user's inventory could not be found."
              : (error ?? "Something went wrong while loading the inventory.")}
          </p>
          {isNotFound ? (
            <Button asChild variant="default" size="sm">
              <Link href="/inventories">Browse Inventories</Link>
            </Button>
          ) : (
            hasValidRobloxId &&
            INVENTORY_API_URL && (
              <Button size="sm" onClick={() => void inventoryQuery.refetch()}>
                Try Again
              </Button>
            )
          )}
        </div>
      )}

      {status === "loaded" && !hasItems && (
        <div className="py-6 text-center">
          <Image
            src="https://assets.jailbreakchangelogs.com/assets/images/404.svg"
            alt="No inventory items"
            width={160}
            height={128}
            className="mx-auto mb-4"
          />
          <p className="text-primary-text mb-1 font-semibold">
            No Inventory Items
          </p>
          <p className="text-secondary-text mx-auto mb-6 max-w-sm text-sm leading-relaxed">
            This user doesn&apos;t have any inventory items yet.
          </p>
          <Button asChild variant="default" size="sm">
            <Link href="/inventories">Browse Inventories</Link>
          </Button>
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

          <div className="mb-8 grid grid-cols-1 gap-4 min-[375px]:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {displayedItems.map((item) => {
              const categoryColor = getCategoryColor(item.type);
              const categoryIcon = getCategoryIcon(item.type);
              const itemHref = `/item/${encodeURIComponent(item.type)}/${encodeURIComponent(item.name)}`;

              const imgSrc = getItemImagePath(item.type, item.name, true);
              const isVideo = isVideoItem(item.name);
              const isDrift = isDriftItem(item.type);
              const ownerId = item.isOG ? trimmedId : item.originalOwner;
              const ownerAvatarSrc = getProxyRobloxHeadshotUrl(ownerId);
              const catalogItem = catalogValuesById.get(item.id);
              const season = catalogItem?.season ?? undefined;
              const level = unlockLevel(catalogItem?.level);
              const hasLevel = hasUnlockLevel(level);
              const ownerLabel =
                (ownerId && ownerUsers[ownerId]?.displayName) ||
                (ownerId && ownerUsers[ownerId]?.name) ||
                ownerId;

              return (
                <div
                  key={`${item.id}-${item.copyOrder}`}
                  className={`text-primary-text relative flex min-h-100 flex-col rounded-lg border p-3 transition-all duration-200 ${
                    item.isOG
                      ? "hover:shadow-card-shadow border-[#FFD700] bg-[#FFD700]/10 hover:border-[#FFD700]"
                      : "border-border-card bg-tertiary-bg"
                  }`}
                >
                  {item.copyCount > 1 && (
                    <div className="bg-button-danger text-form-button-text absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold">
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
                        className="text-primary-text bg-tertiary-bg/40 flex h-6 items-center gap-1.5 rounded-md border px-2.5 text-xs leading-none font-medium backdrop-blur-xl"
                        style={{
                          borderColor: categoryColor,
                          backgroundColor: `${categoryColor}22`,
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
                    {(typeof season === "number" || hasLevel) && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="absolute right-2 bottom-2 z-10 flex cursor-help items-center gap-1">
                            {typeof season === "number" && (
                              <span className="bg-button-info text-form-button-text inline-flex h-6 items-center rounded-md px-2 text-xs leading-none font-bold">
                                S{season}
                              </span>
                            )}
                            {hasLevel && (
                              <span className="bg-status-success text-form-button-text inline-flex h-6 items-center rounded-md px-2 text-xs leading-none font-bold">
                                {formatUnlockLevelBadge(level)}
                              </span>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {formatUnlockRequirementsTooltip(season, level)}
                        </TooltipContent>
                      </Tooltip>
                    )}
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
                                      defaultAvatar.innerHTML = `<svg class="h-5 w-5 text-tertiary-text" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" /></svg>`;
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

                  <div className="border-secondary-text mt-3 min-h-10 border-t pt-3">
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
