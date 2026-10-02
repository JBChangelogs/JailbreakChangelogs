"use client";

import Image from "next/image";
import type { PartialItem } from "@/utils/api/api";
import { getItemImagePath, handleImageError } from "@/utils/ui/images";
import { getCategoryColor, getCategoryIcon } from "@/utils/items/categoryIcons";

export const VALUES_SUGGESTIONS_ID = "values-search-suggestions";
const SUGGESTIONS_LIMIT = 8;

export const getItemHref = (item: PartialItem) =>
  `/item/${encodeURIComponent(item.type)}/${encodeURIComponent(item.name)}`;

export function getItemSuggestions(
  items: PartialItem[] | undefined,
  term: string,
): PartialItem[] {
  const query = term.trim().toLowerCase();
  if (!items || !query) return [];

  const ranked: { item: PartialItem; rank: number }[] = [];
  for (const item of items) {
    const name = item.name.toLowerCase();
    const index = name.indexOf(query);
    if (index === -1) continue;
    const rank =
      name === query ? 0 : index === 0 ? 1 : name[index - 1] === " " ? 2 : 3;
    ranked.push({ item, rank });
  }

  return ranked
    .sort(
      (a, b) =>
        a.rank - b.rank ||
        a.item.name.length - b.item.name.length ||
        a.item.name.localeCompare(b.item.name),
    )
    .slice(0, SUGGESTIONS_LIMIT)
    .map(({ item }) => item);
}

interface ValuesSearchSuggestionsProps {
  suggestions: PartialItem[];
  highlightedIndex: number;
  onHighlight: (index: number) => void;
  onSelect: (item: PartialItem) => void;
}

export default function ValuesSearchSuggestions({
  suggestions,
  highlightedIndex,
  onHighlight,
  onSelect,
}: ValuesSearchSuggestionsProps) {
  return (
    <ul
      id={VALUES_SUGGESTIONS_ID}
      role="listbox"
      className="border-border-card bg-secondary-bg absolute top-full left-0 z-40 mt-1 max-h-96 w-full overflow-y-auto rounded-lg border shadow-lg"
    >
      {suggestions.map((item, index) => {
        const categoryColor = getCategoryColor(item.type);
        const categoryIcon = getCategoryIcon(item.type);
        return (
          <li
            key={item.id}
            id={`${VALUES_SUGGESTIONS_ID}-${index}`}
            role="option"
            aria-selected={index === highlightedIndex}
          >
            <button
              type="button"
              tabIndex={-1}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onSelect(item)}
              onMouseEnter={() => onHighlight(index)}
              className={`flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left transition-colors ${
                index === highlightedIndex
                  ? "bg-tertiary-bg"
                  : "hover:bg-tertiary-bg"
              }`}
            >
              <div className="bg-quaternary-bg relative h-9 w-16 shrink-0 overflow-hidden rounded-md">
                <Image
                  src={getItemImagePath(item.type, item.name, true)}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                  onError={handleImageError}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-primary-text truncate text-sm font-medium">
                  {item.name}
                </p>
                <span
                  className="text-primary-text mt-1 inline-flex h-5 max-w-full items-center gap-1 rounded-lg border px-2 text-[10px] leading-none font-medium"
                  style={{
                    borderColor: categoryColor,
                    backgroundColor: `${categoryColor}22`,
                  }}
                >
                  {categoryIcon && (
                    <categoryIcon.Icon
                      className="h-3 w-3 shrink-0"
                      style={{ color: categoryColor }}
                    />
                  )}
                  <span className="truncate">{item.type}</span>
                </span>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
