"use client";

import { Icon } from "../ui/IconWrapper";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCommentsContext } from "./CommentsContext";

export function CommentHeader() {
  const {
    totalComments,
    type,
    changelogId,
    changelogTitle,
    itemType,
    sortOrder,
    availableSorts,
    handleSortChange,
  } = useCommentsContext();

  return (
    <div>
      <h2
        id="comments-header"
        className="text-primary-text min-w-0 text-lg font-bold tracking-tight sm:text-xl"
      >
        {totalComments === 1
          ? "1 Comment for"
          : `${totalComments} Comments for`}{" "}
        {type === "changelog" ? (
          `Changelog ${changelogId}: ${changelogTitle}`
        ) : type === "season" ? (
          `Season ${changelogId}: ${changelogTitle}`
        ) : type === "tradev2" ? (
          `Trade #${changelogId}`
        ) : type === "inventory" ? (
          changelogTitle
        ) : type === "vsuggestion" ? (
          changelogTitle
        ) : (
          <>
            {changelogTitle}{" "}
            <span className="text-secondary-text">({itemType})</span>
          </>
        )}
      </h2>
      {/* Disclaimer */}
      <p className="text-secondary-text mt-1 flex items-start gap-1 text-xs">
        <Icon
          icon="heroicons:information-circle"
          className="mt-0.5 h-3.5 w-3.5 shrink-0"
        />
        Comments are posted by users and are not verified. Some information may
        be incorrect or misleading
      </p>
      {/* Sort row */}
      <div className="mt-2 flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="text-secondary-text flex items-center gap-1 text-xs">
              <span>Sorted by:</span>
              <button
                type="button"
                className="text-primary-text flex cursor-pointer items-center gap-0.5 font-medium focus:outline-none"
              >
                {sortOrder
                  ? sortOrder.charAt(0).toUpperCase() + sortOrder.slice(1)
                  : ""}
                <Icon
                  icon="heroicons:chevron-down"
                  className="h-3.5 w-3.5 shrink-0"
                  inline={true}
                />
              </button>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="border-border-card bg-secondary-bg text-primary-text rounded-xl border p-1 shadow-lg"
          >
            <DropdownMenuRadioGroup
              value={sortOrder ?? ""}
              onValueChange={handleSortChange}
            >
              {availableSorts.map((s) => (
                <DropdownMenuRadioItem
                  key={s}
                  value={s}
                  className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
