"use client";

import { Fragment, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { ItemDetails } from "@/types";
import { fetchSimilarItems, fetchSimilarItemSorts } from "@/utils/api/api";
import { Icon } from "@/components/ui/IconWrapper";
import ItemCard from "./ItemCard";
import ItemCardSkeleton from "./ItemCardSkeleton";
import { useAuthContext } from "@/contexts/AuthContext";
import { useUserFavorites } from "@/hooks/useUserFavorites";
import { fetchFurniturePlacementLimits } from "@/utils/items/furniturePlacementLimits";
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

const SIMILAR_ITEMS_LIMIT = 6;

interface SimilarItemsProps {
  currentItem: ItemDetails;
}

const SimilarItems = ({ currentItem }: SimilarItemsProps) => {
  const [selectedSort, setSelectedSort] = useState<string | null>(null);
  const { user } = useAuthContext();
  const favoritesQuery = useUserFavorites(user?.id);
  const { data: placementLimitsMap } = useQuery({
    queryKey: ["furniture-placement-limits"],
    queryFn: fetchFurniturePlacementLimits,
    staleTime: Infinity,
    gcTime: 60 * 60_000,
    retry: false,
  });

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
    <div className="@container space-y-4 sm:space-y-6">
      <div className="space-y-4">
        <h3 className="text-primary-text text-2xl font-bold">
          Similar Items{" "}
          {!sortsPending && !itemsPending && (
            <span className="text-secondary-text ml-1 text-sm font-normal">
              {similarItems?.length ?? 0}
            </span>
          )}
        </h3>

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
        <div className="grid grid-cols-1 gap-4 min-[375px]:@min-[20rem]:grid-cols-2 @min-[40rem]:grid-cols-3">
          {[...Array(SIMILAR_ITEMS_LIMIT)].map((_, i) => (
            <ItemCardSkeleton key={i} />
          ))}
        </div>
      ) : !similarItems || similarItems.length === 0 ? (
        <div className="border-border-card bg-secondary-bg rounded-lg border p-8 text-center">
          <div className="border-button-info/30 bg-icon-tile-bg mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border">
            <Icon
              icon="heroicons-outline:sparkles"
              className="text-icon-tile h-8 w-8"
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
        <div className="grid grid-cols-1 gap-4 min-[375px]:@min-[20rem]:grid-cols-2 @min-[40rem]:grid-cols-3">
          {similarItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              showValues
              isFavorited={
                favoritesQuery.data?.some(
                  (favorite) => favorite.item.id === item.id,
                ) ?? false
              }
              placementLimit={placementLimitsMap?.get(item.id) ?? null}
              onFavoriteChange={() => {
                void favoritesQuery.refetch();
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SimilarItems;
