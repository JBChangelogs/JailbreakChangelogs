"use client";

import NumberFlow from "@number-flow/react";
import { Icon } from "../ui/IconWrapper";
import { Fragment } from "react";
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
import { useCommentsContext } from "./CommentsContext";

export function CommentHeader() {
  const {
    totalComments,
    type,
    changelogId,
    changelogTitle,
    itemType,
    sortOrder,
    sortGroups,
    handleSortChange,
    containerBgClass,
    pinnedTitle,
  } = useCommentsContext();

  return (
    <>
      <h2
        id="comments-header"
        className={`text-primary-text ${containerBgClass} sticky top-(--header-height) z-10 -mx-2 -mt-2 min-w-0 px-2 py-2 text-lg font-bold tracking-tight sm:-mx-3 sm:px-3 sm:text-xl ${pinnedTitle ? "xl:static" : ""}`}
      >
        <span>
          <NumberFlow translate="no" value={totalComments} />{" "}
          {totalComments === 1 ? "Comment for" : "Comments for"}
        </span>{" "}
        <span>
          {type === "changelog" ? (
            `Changelog ${changelogId}: ${changelogTitle}`
          ) : type === "season" ? (
            `Season ${changelogId}: ${changelogTitle}`
          ) : type === "tradev2" ? (
            `Trade #${changelogId}`
          ) : type === "inventory" || type === "user" ? (
            changelogTitle
          ) : type === "vsuggestion" ? (
            changelogTitle
          ) : (
            <>
              <span>{changelogTitle} </span>
              <span className="text-secondary-text">({itemType})</span>
            </>
          )}
        </span>
      </h2>
      {/* -mt-5 offsets the title's padding and the parent's gap-4 */}
      <div className="-mt-5">
        {/* Disclaimer */}
        <p className="text-secondary-text flex items-start gap-1 text-xs">
          <Icon
            icon="heroicons:information-circle"
            className="mt-0.5 h-3.5 w-3.5 shrink-0"
          />
          <span>
            Comments are posted by users and are not verified. Some information
            may be incorrect or misleading
          </span>
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
                  <span>{getSortLabel(sortGroups, sortOrder)}</span>
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
        </div>
      </div>
    </>
  );
}
