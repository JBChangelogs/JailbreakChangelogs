"use client";

import { Fragment, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { ItemDetails } from "@/types";
import { fetchSimilarItems, fetchSimilarItemSorts } from "@/utils/api/api";
import Image from "next/image";
import {
  handleImageError,
  getItemImagePath,
  isVideoItem,
  getVideoPath,
} from "@/utils/ui/images";
import Link from "next/link";
import { Icon } from "@/components/ui/IconWrapper";
import { formatFullValue } from "@/utils/trading/values";
import { getCategoryColor, getCategoryIcon } from "@/utils/items/categoryIcons";
import { getTrendColor, getDemandColor } from "@/utils/items/badgeColors";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getSortLabel } from "@/utils/api/sortGroups";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { unlockLevel } from "@/utils/items/season";
import { hasItemValue } from "@/utils/items/itemValue";
import {
  formatUnlockLevelBadge,
  formatUnlockRequirementsTooltip,
  hasUnlockLevel,
} from "@/utils/items/itemUnlockPresentation";

const SIMILAR_ITEMS_LIMIT = 6;

interface SimilarItemsProps {
  currentItem: ItemDetails;
}

function SeasonLevelBadges({ item }: { item: ItemDetails }) {
  const level = unlockLevel(item.level);
  const hasLevel = hasUnlockLevel(level);
  if (item.season == null && !hasLevel) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="absolute right-2 bottom-2 z-10 flex cursor-help items-center gap-1">
          {item.season != null && (
            <span className="bg-button-info text-form-button-text inline-flex h-6 items-center rounded-lg px-2 text-xs leading-none font-bold">
              S{item.season}
            </span>
          )}
          {hasLevel && (
            <span className="bg-status-success text-form-button-text inline-flex h-6 items-center rounded-lg px-2 text-xs leading-none font-bold">
              {formatUnlockLevelBadge(level)}
            </span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {formatUnlockRequirementsTooltip(item.season ?? undefined, level)}
      </TooltipContent>
    </Tooltip>
  );
}

const SimilarItems = ({ currentItem }: SimilarItemsProps) => {
  const [selectedSort, setSelectedSort] = useState<string | null>(null);

  const { data: sortGroups = [], isPending: sortsPending } = useQuery({
    queryKey: ["similar-item-sorts"],
    queryFn: fetchSimilarItemSorts,
    staleTime: Infinity,
    gcTime: 30 * 60_000,
  });
  const sortBy = selectedSort ?? sortGroups[0]?.options[0]?.value ?? null;

  const { data: similarItems, isPending: itemsPending } = useQuery({
    queryKey: ["similar-items", currentItem.id, sortBy],
    queryFn: () =>
      fetchSimilarItems(currentItem.id, sortBy, SIMILAR_ITEMS_LIMIT),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    // Without sorts, fall back to the endpoint's default sort.
    enabled: !sortsPending,
  });

  return (
    <div className="border-border-card bg-secondary-bg hover:shadow-card-shadow space-y-6 rounded-lg border p-6 shadow-lg transition-all duration-200">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="bg-button-info/20 flex h-8 w-8 items-center justify-center rounded-lg">
            <Icon
              icon="heroicons-outline:sparkles"
              className="text-link h-5 w-5"
            />
          </div>
          <h3 className="text-primary-text text-xl font-semibold">
            Similar Items
          </h3>
        </div>

        {sortGroups.length > 0 && sortBy && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="border-border-card bg-tertiary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 flex h-14 w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all duration-300 focus:ring-1 focus:outline-none"
                aria-label="Sort similar items"
              >
                <span className="truncate">
                  Sort by {getSortLabel(sortGroups, sortBy)}
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
              className="border-border-card bg-tertiary-bg text-primary-text max-h-60 w-(--radix-popper-anchor-width) min-w-(--radix-popper-anchor-width) scrollbar-thin overflow-x-hidden overflow-y-auto rounded-xl border p-1 shadow-lg"
            >
              <DropdownMenuRadioGroup
                value={sortBy}
                onValueChange={setSelectedSort}
              >
                {sortGroups.map((group, index) => (
                  <Fragment key={group.label}>
                    {index > 0 && <DropdownMenuSeparator />}
                    <DropdownMenuLabel className="text-secondary-text px-3 py-1 text-xs tracking-widest uppercase">
                      {group.label}
                    </DropdownMenuLabel>
                    {group.options.map((option) => (
                      <DropdownMenuRadioItem
                        key={option.value}
                        value={option.value}
                        className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                      >
                        {option.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </Fragment>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {sortsPending || itemsPending ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3">
          {[...Array(SIMILAR_ITEMS_LIMIT)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="border-border-card bg-tertiary-bg mb-3 aspect-video rounded-lg border"></div>
              <div className="bg-secondary-bg mb-2 h-4 w-3/4 rounded"></div>
              <div className="bg-secondary-bg h-4 w-1/2 rounded"></div>
            </div>
          ))}
        </div>
      ) : !similarItems || similarItems.length === 0 ? (
        <div className="border-border-card bg-secondary-bg rounded-lg border p-8 text-center">
          <div className="border-button-info/30 bg-button-info/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border">
            <Icon
              icon="heroicons-outline:sparkles"
              className="text-button-info h-8 w-8"
            />
          </div>
          <h4 className="text-primary-text mb-2 text-lg font-semibold">
            No Similar Items Found
          </h4>
          <p className="text-secondary-text mx-auto max-w-md text-sm leading-relaxed">
            We couldn&apos;t find any items similar to this one
            {sortBy
              ? ` when sorting by ${getSortLabel(sortGroups, sortBy)}`
              : ""}
            . Try a different sort option.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3">
          {similarItems.map((item) => (
            <Link
              key={item.id}
              href={`/item/${encodeURIComponent(item.type)}/${encodeURIComponent(item.name)}`}
              className="group block"
              prefetch={false}
            >
              <div className="border-border-card bg-tertiary-bg relative overflow-hidden rounded-lg border transition-all duration-300">
                <div className="relative aspect-video w-full overflow-hidden">
                  {isVideoItem(item.name) ? (
                    <video
                      src={getVideoPath(item.type, item.name)}
                      loop
                      muted
                      playsInline
                      autoPlay
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Image
                      src={getItemImagePath(item.type, item.name, true)}
                      alt={item.name}
                      fill
                      className="object-cover"
                      onError={handleImageError}
                    />
                  )}
                  <SeasonLevelBadges item={item} />
                </div>

                <div className="flex flex-1 flex-col space-y-2 p-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-primary-text group-hover:text-link line-clamp-2 text-sm leading-tight font-semibold transition-colors">
                      {item.name}
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    <span
                      className="text-primary-text bg-tertiary-bg/40 inline-flex h-6 items-center rounded-lg border px-2.5 text-xs leading-none font-medium backdrop-blur-xl"
                      style={{
                        borderColor: getCategoryColor(item.type),
                        backgroundColor: `${getCategoryColor(item.type)}22`,
                      }}
                    >
                      {(() => {
                        const categoryIcon = getCategoryIcon(item.type);
                        return categoryIcon ? (
                          <categoryIcon.Icon
                            className="mr-1.5 h-3 w-3"
                            style={{ color: getCategoryColor(item.type) }}
                          />
                        ) : null;
                      })()}
                      {item.type}
                    </span>
                    {(item.tradable === 0 || item.tradable === false) && (
                      <span className="text-primary-text border-border-card bg-tertiary-bg/40 inline-flex h-6 items-center rounded-lg border px-2.5 text-xs leading-none font-medium backdrop-blur-xl">
                        {item.id === 713 ? "Reference Only" : "Non-Tradable"}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="border-border-card bg-secondary-bg flex items-center justify-between rounded-lg border p-1.5">
                      <span className="text-secondary-text text-[10px] font-medium">
                        Cash
                      </span>
                      <span className="bg-button-info text-form-button-text inline-flex h-6 items-center rounded-lg px-2 text-xs leading-none font-bold">
                        {formatFullValue(item.cash_value)}
                      </span>
                    </div>

                    <div className="border-border-card bg-secondary-bg flex items-center justify-between rounded-lg border p-1.5">
                      <span className="text-secondary-text text-[10px] font-medium">
                        Duped
                      </span>
                      <span className="bg-button-info text-form-button-text inline-flex h-6 items-center rounded-lg px-2 text-xs leading-none font-bold">
                        {formatFullValue(item.duped_value)}
                      </span>
                    </div>

                    <div className="border-border-card bg-secondary-bg flex items-center justify-between rounded-lg border p-1.5">
                      <span className="text-secondary-text text-[10px] font-medium">
                        Demand
                      </span>
                      <span
                        className={`${getDemandColor(item.demand)} inline-flex h-6 items-center rounded-lg px-2 text-xs leading-none font-bold whitespace-nowrap`}
                      >
                        {hasItemValue(item.demand) ? item.demand : "Unknown"}
                      </span>
                    </div>

                    <div className="border-border-card bg-secondary-bg flex items-center justify-between rounded-lg border p-1.5">
                      <span className="text-secondary-text text-[10px] font-medium">
                        Trend
                      </span>
                      <span
                        className={`${getTrendColor(item.trend)} inline-flex h-6 items-center rounded-lg px-2 text-xs leading-none font-bold whitespace-nowrap`}
                      >
                        {hasItemValue(item.trend) ? item.trend : "Unknown"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default SimilarItems;
