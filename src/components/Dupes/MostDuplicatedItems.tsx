"use client";

import Image from "next/image";
import Link from "next/link";
import { getCategoryColor, getCategoryIcon } from "@/utils/items/categoryIcons";
import { DuplicatedItem } from "@/utils/api/api";
import { getItemImagePath, handleImageError } from "@/utils/ui/images";

interface MostDuplicatedItemsProps {
  items: DuplicatedItem[];
}

export default function MostDuplicatedItems({
  items,
}: MostDuplicatedItemsProps) {
  "use no memo";

  const topItems = items && items.length > 0 ? items.slice(0, 26) : [];

  if (topItems.length === 0) {
    return null;
  }

  const highestCount = Math.max(1, ...topItems.map((item) => item.count));

  return (
    <section
      aria-labelledby="most-duplicated-items-heading"
      className="border-border-card bg-secondary-bg mt-6 mb-6 overflow-hidden rounded-xl border"
    >
      <div className="border-border-card border-b px-4 py-5 sm:px-6">
        <h2
          id="most-duplicated-items-heading"
          className="text-primary-text text-lg font-semibold"
        >
          Most tracked duplicates
        </h2>
        <p className="text-secondary-text mt-1 text-sm">
          Top 26 items by tracked duplicate count
        </p>
      </div>

      <div
        role="region"
        aria-label="Most tracked duplicates ranked list"
        tabIndex={0}
        className="focus-visible:outline-border-focus max-h-[32rem] overflow-y-auto overscroll-contain focus-visible:outline-2 focus-visible:-outline-offset-2"
      >
        <ol className="grid gap-x-8 px-4 sm:px-6 xl:grid-cols-2">
          {topItems.map((item, index) => {
            const categoryIcon = getCategoryIcon(item.type);

            return (
              <li
                key={`${item.name}-${item.type}-${index}`}
                className="border-border-card border-b py-1 last:border-b-0 xl:[&:nth-last-child(2)]:border-b-0"
              >
                <Link
                  href={`/item/${encodeURIComponent(item.type)}/${encodeURIComponent(item.name)}`}
                  prefetch={false}
                  className="group hover:bg-tertiary-bg focus-visible:outline-border-focus -mx-2 flex items-center gap-3 rounded-md px-2 py-2 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 sm:gap-4"
                >
                  <span className="text-secondary-text w-5 shrink-0 text-center text-xs font-medium tabular-nums">
                    <span className="sr-only">Rank </span>
                    {index + 1}
                  </span>
                  <Image
                    src={getItemImagePath(item.type, item.name, true)}
                    alt=""
                    width={112}
                    height={63}
                    className="bg-tertiary-bg aspect-video h-auto w-24 shrink-0 rounded-lg object-contain sm:w-28"
                    onError={handleImageError}
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-primary-text group-hover:text-link block text-sm font-semibold wrap-break-word transition-colors">
                      {item.name}
                    </span>
                    <span
                      className="text-primary-text mt-1 inline-flex max-w-full items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: `${getCategoryColor(item.type)}22`,
                      }}
                    >
                      {categoryIcon && (
                        <categoryIcon.Icon
                          aria-hidden="true"
                          className="h-3 w-3 shrink-0"
                          style={{ color: getCategoryColor(item.type) }}
                        />
                      )}
                      <span className="truncate">{item.type}</span>
                    </span>
                  </div>
                  <div className="w-16 shrink-0 text-right sm:w-32">
                    <span className="text-primary-text text-base font-semibold tabular-nums">
                      {item.count.toLocaleString("en-US")}
                      <span className="sr-only"> tracked duplicates</span>
                    </span>
                    <div
                      aria-hidden="true"
                      className="bg-tertiary-bg mt-2 h-1 overflow-hidden rounded-full"
                    >
                      <div
                        className="bg-link/50 h-full rounded-full"
                        style={{
                          width: `${(item.count / highestCount) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
