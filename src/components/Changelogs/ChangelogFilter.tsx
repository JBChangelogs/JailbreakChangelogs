import React from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Icon } from "@/components/ui/IconWrapper";
import { Button } from "@/components/ui/button";
import ChangelogSearchInput from "./ChangelogSearchInput";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SearchResult {
  id: number;
  title: string;
  contentPreview?: string;
  mediaTypes: string[];
  mentions: string[];
}

interface ChangelogFilterProps {
  changelogList: Array<{ id: number; title: string }>;
  selectedId: string;
  onChangelogSelect: (id: string) => void;
  searchQuery: string;
  searchResults: SearchResult[];
  isSearchFocused: boolean;
  onSearchChange: (query: string) => void;
  onSearchFocus: (focused: boolean) => void;
}

const ChangelogFilter: React.FC<ChangelogFilterProps> = ({
  changelogList,
  selectedId,
  onChangelogSelect,
  searchQuery,
  searchResults,
  isSearchFocused,
  onSearchChange,
  onSearchFocus,
}) => {
  const sortedChangelogs = [...changelogList].sort((a, b) => b.id - a.id);
  const selectedLabel =
    sortedChangelogs.find((item) => item.id.toString() === selectedId)?.title ??
    "";

  return (
    <div className="mb-8 space-y-4">
      {/* Top row: Dropdown and Search */}
      <div className="flex flex-col gap-4 lg:flex-row lg:gap-4">
        {/* Changelog Selector */}
        <div className="flex-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="border-border-card bg-secondary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus flex h-[56px] w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all duration-300 focus:ring-1 focus:outline-none"
                aria-label="Select a changelog"
              >
                <span className="truncate">
                  {selectedId
                    ? `#${selectedId} - ${selectedLabel}`
                    : "Select a changelog"}
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
              className="border-border-card bg-secondary-bg text-primary-text scrollbar-thin max-h-[320px] w-[var(--radix-popper-anchor-width)] min-w-[var(--radix-popper-anchor-width)] overflow-x-hidden overflow-y-auto rounded-xl border p-1 shadow-lg"
            >
              <DropdownMenuRadioGroup
                value={selectedId}
                onValueChange={onChangelogSelect}
              >
                {sortedChangelogs.map((item) => (
                  <DropdownMenuRadioItem
                    key={item.id}
                    value={item.id.toString()}
                    className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                  >
                    #{item.id} - {item.title}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Search Input */}
        <div className="flex-1">
          <ChangelogSearchInput
            searchQuery={searchQuery}
            searchResults={searchResults}
            isSearchFocused={isSearchFocused}
            onSearchChange={onSearchChange}
            onSearchFocus={onSearchFocus}
            onChangelogSelect={onChangelogSelect}
          />
        </div>
      </div>

      {/* Bottom row: Buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
        {/* Go to Latest Update Button */}
        {changelogList.length > 0 && (
          <Button
            variant="default"
            onClick={() => {
              const latestChangelogId = Math.max(
                ...changelogList.map((item) => item.id),
              );
              const isOnLatest = latestChangelogId.toString() === selectedId;

              if (isOnLatest) {
                toast.error("Already on the latest update");
                return;
              }

              onChangelogSelect(latestChangelogId.toString());
              toast.success("Navigated to latest update");
            }}
            disabled={
              Math.max(...changelogList.map((item) => item.id)).toString() ===
              selectedId
            }
          >
            <Icon icon="mdi:clock" className="h-4 w-4" />
            <span>Go to Latest Update</span>
          </Button>
        )}

        {/* View Timeline Button */}
        <Button variant="default" asChild>
          <Link href="/changelogs/timeline">
            <Icon icon="heroicons-solid:clock" className="h-4 w-4" />
            <span>View Timeline</span>
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default ChangelogFilter;
