import React from "react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  count: number;
  page: number;
  onChange: (event: React.ChangeEvent<unknown>, value: number) => void;
  siblingCount?: number;
  className?: string;
}

export const Pagination = ({
  count,
  page,
  onChange,
  siblingCount = 1,
  className,
}: PaginationProps) => {
  // Helper to generate page numbers
  const generatePagination = () => {
    // If total pages is small, show all
    if (count <= 7) {
      return Array.from({ length: count }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(page - siblingCount, 1);
    const rightSiblingIndex = Math.min(page + siblingCount, count);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < count - 2;

    const firstPageIndex = 1;
    const lastPageIndex = count;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
      return [...leftRange, "DOTS", count];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = Array.from(
        { length: rightItemCount },
        (_, i) => count - rightItemCount + i + 1,
      );
      return [firstPageIndex, "DOTS", ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i,
      );
      return [firstPageIndex, "DOTS", ...middleRange, "DOTS", lastPageIndex];
    }

    return [];
  };

  const pages = generatePagination();

  const handlePageChange = (newValue: number) => {
    if (newValue >= 1 && newValue <= count) {
      onChange({} as React.ChangeEvent<unknown>, newValue);
    }
  };

  return (
    <nav
      className={cn("flex items-center justify-center gap-2", className)}
      aria-label="Pagination"
    >
      <button
        onClick={() => handlePageChange(page - 1)}
        disabled={page === 1}
        className={cn(
          "text-primary-text flex h-8 w-8 items-center justify-center rounded-full transition-colors",
          "hover:bg-quaternary-bg cursor-pointer disabled:opacity-50 disabled:hover:bg-transparent",
        )}
        aria-label="Previous page"
      >
        <Icon icon="material-symbols:chevron-left" className="h-5 w-5" />
      </button>

      <ul className="flex items-center gap-1">
        {pages.map((pageNumber, index) => {
          if (pageNumber === "DOTS") {
            return (
              <li
                key={`dots-${index}`}
                className="flex h-8 w-8 items-end justify-center pb-1"
              >
                <span className="text-primary-text/50">...</span>
              </li>
            );
          }

          const isSelected = pageNumber === page;
          return (
            <li key={pageNumber}>
              <button
                onClick={() => handlePageChange(pageNumber as number)}
                className={cn(
                  "flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-full px-3 text-sm font-medium transition-colors",
                  isSelected
                    ? "bg-button-info text-form-button-text hover:bg-button-info-hover"
                    : "text-primary-text hover:bg-quaternary-bg",
                )}
                aria-current={isSelected ? "page" : undefined}
              >
                {pageNumber}
              </button>
            </li>
          );
        })}
      </ul>

      <button
        onClick={() => handlePageChange(page + 1)}
        disabled={page === count}
        className={cn(
          "text-primary-text flex h-8 w-8 items-center justify-center rounded-full transition-colors",
          "hover:bg-quaternary-bg cursor-pointer disabled:opacity-50 disabled:hover:bg-transparent",
        )}
        aria-label="Next page"
      >
        <Icon icon="material-symbols:chevron-right" className="h-5 w-5" />
      </button>
    </nav>
  );
};
