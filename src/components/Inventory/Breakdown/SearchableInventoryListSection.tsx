"use client";

import Link from "next/link";
import {
  memo,
  useDeferredValue,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getCategoryColor, getCategoryIcon } from "@/utils/items/categoryIcons";
import { matchesTextSearch } from "@/utils/helpers/itemSearch";
import { Icon } from "@/components/ui/IconWrapper";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  formatInventoryCount,
  secondaryFilterDropdownContentClassName,
  secondaryFilterDropdownTriggerClassName,
  secondaryFilterInputClassName,
  VALUES_TYPE_ORDER_RANK,
  type InventoryListEntry,
} from "@/components/Inventory/Breakdown/constants";

interface SearchableInventoryListSectionProps {
  title: string;
  tooltipContent: ReactNode;
  items: InventoryListEntry[];
  searchPlaceholder: string;
  filterAriaLabel: string;
  clearAriaLabel: string;
  emptyMessage: string;
  noResultsMessage: string;
  helperContent?: ReactNode;
  sectionRef?: React.RefObject<HTMLDivElement | null>;
  sectionId?: string;
}

const SearchableInventoryListSection = memo(
  function SearchableInventoryListSection({
    title,
    tooltipContent,
    items,
    searchPlaceholder,
    filterAriaLabel,
    clearAriaLabel,
    emptyMessage,
    noResultsMessage,
    helperContent,
    sectionRef,
    sectionId,
  }: SearchableInventoryListSectionProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const deferredSearchTerm = useDeferredValue(searchTerm);

    const typeOptions = useMemo(() => {
      const seen = new Set<string>();
      const uniqueTypes: string[] = [];
      items.forEach((item) => {
        if (seen.has(item.type)) return;
        seen.add(item.type);
        uniqueTypes.push(item.type);
      });
      uniqueTypes.sort((a, b) => {
        const aRank = VALUES_TYPE_ORDER_RANK.get(a.toLowerCase()) ?? 999;
        const bRank = VALUES_TYPE_ORDER_RANK.get(b.toLowerCase()) ?? 999;
        if (aRank !== bRank) return aRank - bRank;
        return a.localeCompare(b);
      });
      return uniqueTypes;
    }, [items]);

    const filteredItems = useMemo(() => {
      const normalizedTypeFilter = typeFilter.trim().toLowerCase();
      const typeFiltered =
        normalizedTypeFilter === "all"
          ? items
          : items.filter(
              (item) => item.type.toLowerCase() === normalizedTypeFilter,
            );
      return typeFiltered.filter((item) =>
        matchesTextSearch([item.name, item.type], deferredSearchTerm),
      );
    }, [deferredSearchTerm, items, typeFilter]);

    return (
      <div
        ref={sectionRef}
        id={sectionId}
        className="border-border-card bg-tertiary-bg rounded-lg border p-3"
      >
        <div className="mb-2 flex items-center gap-1.5">
          <div className="text-primary-text text-sm font-semibold">
            {title} ({formatInventoryCount(items.length)})
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Icon
                icon="material-symbols:info-outline"
                className="text-secondary-text h-4 w-4 cursor-help"
                inline={true}
              />
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="bg-secondary-bg text-primary-text max-w-62.5 border-none shadow-(--color-card-shadow)"
            >
              {tooltipContent}
            </TooltipContent>
          </Tooltip>
        </div>
        {helperContent ? (
          <div className="text-secondary-text mb-2 text-xs">
            {helperContent}
          </div>
        ) : null}
        <div className="mb-2">
          <div className="flex w-full flex-col gap-4 sm:flex-row">
            <div className="relative w-full sm:w-2/3">
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                maxLength={80}
                className={secondaryFilterInputClassName}
              />
              <Icon
                icon="heroicons:magnifying-glass"
                className="text-secondary-text absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
              />
              {searchTerm ? (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="text-secondary-text hover:text-primary-text absolute top-1/2 right-2 h-6 w-6 -translate-y-1/2 cursor-pointer"
                  aria-label={clearAriaLabel}
                >
                  <Icon icon="heroicons:x-mark" />
                </button>
              ) : null}
            </div>
            <div className="w-full sm:w-1/3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={secondaryFilterDropdownTriggerClassName}
                    aria-label={filterAriaLabel}
                  >
                    <span className="truncate">
                      {typeFilter === "all" ? "All types" : typeFilter}
                    </span>
                    <Icon
                      icon="heroicons:chevron-down"
                      className="text-secondary-text h-4 w-4"
                      inline={true}
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className={secondaryFilterDropdownContentClassName}
                >
                  <DropdownMenuRadioGroup
                    value={typeFilter}
                    onValueChange={(value) => setTypeFilter(value)}
                  >
                    <DropdownMenuRadioItem
                      value="all"
                      className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                    >
                      All types
                    </DropdownMenuRadioItem>
                    {typeOptions.map((type) => (
                      <DropdownMenuRadioItem
                        key={type}
                        value={type}
                        className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                      >
                        {type}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {(searchTerm.trim() || typeFilter !== "all") && (
            <div className="text-secondary-text mt-1 text-xs">
              Showing {formatInventoryCount(filteredItems.length)} of{" "}
              {formatInventoryCount(items.length)}
            </div>
          )}
        </div>
        {items.length === 0 ? (
          <p className="text-secondary-text text-sm">{emptyMessage}</p>
        ) : filteredItems.length === 0 ? (
          <p className="text-secondary-text text-sm">{noResultsMessage}</p>
        ) : (
          <div className="max-h-65 scrollbar-thin overflow-auto pr-1 text-sm">
            <ol className="divide-border-card/60 space-y-0 divide-y">
              {filteredItems.map((item, idx) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:gap-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="text-secondary-text w-10 shrink-0 text-right font-mono text-xs font-medium tabular-nums">
                      {idx + 1}.
                    </span>
                    <Link
                      href={`/item/${encodeURIComponent(item.type)}/${encodeURIComponent(item.name)}`}
                      prefetch={false}
                      className="text-primary-text hover:text-link min-w-0 flex-1 truncate text-sm font-semibold transition-colors"
                    >
                      {" "}
                      {item.name}
                    </Link>
                  </div>
                  <div className="flex justify-end sm:ml-auto">
                    <span
                      className="text-primary-text bg-tertiary-bg/40 inline-flex h-6 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-xs leading-none font-medium backdrop-blur-xl"
                      style={{ borderColor: getCategoryColor(item.type) }}
                    >
                      {(() => {
                        const categoryIcon = getCategoryIcon(item.type);
                        return categoryIcon ? (
                          <categoryIcon.Icon
                            className="h-3 w-3"
                            style={{ color: getCategoryColor(item.type) }}
                          />
                        ) : null;
                      })()}
                      {item.type}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    );
  },
);

export default SearchableInventoryListSection;
