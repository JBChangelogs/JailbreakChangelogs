import React from "react";
import { ClockIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { ClockIcon as ClockIconSolid } from "@heroicons/react/24/solid";
import ChangelogSearchInput from "./ChangelogSearchInput";

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
  return (
    <div className="mb-8 space-y-4">
      {/* Top row: Dropdown and Search */}
      <div className="flex flex-col gap-4 lg:flex-row lg:gap-4">
        {/* Changelog Selector */}
        <div className="flex-1">
          <select
            className="select w-full bg-secondary-bg text-primary-text font-inter"
            value={selectedId}
            onChange={(e) => onChangelogSelect(e.target.value)}
          >
            <option value="" disabled>
              Select a changelog
            </option>
            {changelogList
              .sort((a, b) => b.id - a.id)
              .map((item) => (
                <option key={item.id} value={item.id.toString()}>
                  #{item.id} - {item.title}
                </option>
              ))}
          </select>
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
          <button
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
            className={`bg-button-info text-form-button-text hover:bg-button-info-hover flex cursor-pointer items-center gap-2 rounded px-4 py-2 transition-colors ${
              Math.max(...changelogList.map((item) => item.id)).toString() ===
              selectedId
                ? "cursor-not-allowed opacity-50"
                : ""
            }`}
            aria-disabled={
              Math.max(...changelogList.map((item) => item.id)).toString() ===
              selectedId
            }
          >
            <ClockIcon className="h-4 w-4" />
            <span>Go to Latest Update</span>
          </button>
        )}

        {/* View Timeline Button */}
        <Link
          href="/changelogs/timeline"
          className="bg-button-info text-form-button-text hover:bg-button-info-hover flex cursor-pointer items-center gap-2 rounded px-4 py-2 transition-colors"
        >
          <ClockIconSolid className="h-4 w-4" />
          <span>View Timeline</span>
        </Link>
      </div>
    </div>
  );
};

export default ChangelogFilter;
