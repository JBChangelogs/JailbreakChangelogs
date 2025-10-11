import React, { useState, useEffect } from "react";
import { ClockIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { ClockIcon as ClockIconSolid } from "@heroicons/react/24/solid";
import { Icon } from "../UI/IconWrapper";
import dynamic from "next/dynamic";
import ChangelogSearchInput from "./ChangelogSearchInput";

const Select = dynamic(() => import("react-select"), { ssr: false });

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
  const [selectLoaded, setSelectLoaded] = useState(false);

  // Set selectLoaded to true after mount to ensure client-side rendering
  useEffect(() => {
    setSelectLoaded(true);
  }, []);

  // Create options for the select dropdown
  const selectOptions = changelogList.map((item) => ({
    value: item.id.toString(),
    label: `#${item.id} - ${item.title}`,
  }));

  // Find the current selected option
  const selectedOption =
    selectOptions.find((option) => option.value === selectedId) || null;

  return (
    <div className="mb-8 grid grid-cols-1 gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Changelog Selector */}
        {selectLoaded ? (
          <Select
            value={selectedOption}
            onChange={(option: unknown) => {
              if (!option) {
                onChangelogSelect("");
                return;
              }
              const newValue = (option as { value: string }).value;
              onChangelogSelect(newValue);
            }}
            options={selectOptions}
            placeholder="Select a changelog"
            className="w-full"
            isClearable={false}
            isSearchable={false}
            unstyled
            classNames={{
              control: () =>
                "text-secondary-text flex items-center justify-between rounded-lg border border-button-info bg-secondary-bg p-3 min-h-[56px] hover:cursor-pointer",
              singleValue: () => "text-secondary-text",
              placeholder: () => "text-secondary-text",
              menu: () =>
                "absolute z-[3000] mt-1 w-full rounded-lg border border-border-primary hover:border-border-focus bg-secondary-bg shadow-lg",
              option: ({ isSelected, isFocused }) =>
                `px-4 py-3 cursor-pointer ${
                  isSelected
                    ? "bg-button-info text-primary-text"
                    : isFocused
                      ? "bg-quaternary-bg text-primary-text"
                      : "bg-secondary-bg text-secondary-text"
                }`,
              clearIndicator: () =>
                "text-secondary-text hover:text-primary-text cursor-pointer",
              dropdownIndicator: () =>
                "text-secondary-text hover:text-primary-text cursor-pointer",
            }}
          />
        ) : (
          <div className="border-border-primary hover:border-border-focus bg-secondary-bg h-12 w-full animate-pulse rounded-lg border"></div>
        )}

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
            className={`text-secondary-text border-button-info bg-secondary-bg flex items-center justify-between rounded-lg border p-3 focus:outline-none ${
              Math.max(...changelogList.map((item) => item.id)).toString() ===
              selectedId
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer"
            }`}
            aria-disabled={
              Math.max(...changelogList.map((item) => item.id)).toString() ===
              selectedId
            }
          >
            <span>Go to Latest Update</span>
            <ClockIcon className="text-button-info h-5 w-5" />
          </button>
        )}

        {/* View Timeline Button */}
        <Link
          href="/changelogs/timeline"
          className="text-secondary-text border-button-info bg-secondary-bg flex items-center justify-between rounded-lg border p-3 focus:outline-none"
        >
          <span>View Timeline</span>
          <ClockIconSolid className="text-button-info h-5 w-5" />
        </Link>

        {/* Random Changelog Button */}
        <button
          onClick={() => {
            const randomIndex = Math.floor(
              Math.random() * changelogList.length,
            );
            const randomChangelog = changelogList[randomIndex];
            onChangelogSelect(randomChangelog.id.toString());
            toast.success(
              `Navigated to random changelog: ${randomChangelog.title}`,
            );
          }}
          className="text-secondary-text border-button-info bg-secondary-bg flex cursor-pointer items-center justify-between rounded-lg border p-3 focus:outline-none"
        >
          <span>Random Changelog</span>
          <Icon
            icon="streamline-ultimate:dice-bold"
            className="text-button-info h-5 w-5"
            inline={true}
          />
        </button>
      </div>

      {/* Search Input */}
      <ChangelogSearchInput
        searchQuery={searchQuery}
        searchResults={searchResults}
        isSearchFocused={isSearchFocused}
        onSearchChange={onSearchChange}
        onSearchFocus={onSearchFocus}
        onChangelogSelect={onChangelogSelect}
      />
    </div>
  );
};

export default ChangelogFilter;
