import React from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { getBadgeColor, highlightText } from "@/utils/changelogs";

interface SearchResult {
  id: number;
  title: string;
  contentPreview?: string;
  mediaTypes: string[];
  mentions: string[];
}

interface ChangelogSearchInputProps {
  searchQuery: string;
  searchResults: SearchResult[];
  isSearchFocused: boolean;
  onSearchChange: (query: string) => void;
  onSearchFocus: (focused: boolean) => void;
  onChangelogSelect: (id: string) => void;
  placeholder?: string;
  className?: string;
}

const ChangelogSearchInput: React.FC<ChangelogSearchInputProps> = ({
  searchQuery,
  searchResults,
  isSearchFocused,
  onSearchChange,
  onSearchFocus,
  onChangelogSelect,
  placeholder = "Search changelogs...",
  className = "",
}) => {
  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        onFocus={() => onSearchFocus(true)}
        onBlur={() => {
          setTimeout(() => onSearchFocus(false), 200);
        }}
        placeholder={placeholder}
        className="text-secondary-text border-border-primary hover:border-border-focus bg-secondary-bg placeholder-secondary-text focus:border-button-info w-full rounded-lg border px-4 py-2 pr-10 pl-10 focus:outline-none"
      />
      <div className="absolute top-1/2 left-3 -translate-y-1/2">
        <MagnifyingGlassIcon className="text-primary-text h-5 w-5" />
      </div>
      {searchQuery && (
        <button
          onClick={() => {
            onSearchChange("");
          }}
          className="hover:text-secondary-text text-primary-text absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer"
          aria-label="Clear search"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      )}

      {/* Quick Filter Buttons */}
      {isSearchFocused && !searchQuery && (
        <div className="border-tertiary-bg bg-secondary-bg absolute z-10 mt-1 w-full rounded-lg border p-2 shadow-lg">
          <div className="flex flex-col gap-1">
            <button
              onClick={() => onSearchChange("has:video ")}
              className="border-border-primary hover:border-border-focus bg-secondary-bg hover:bg-primary-bg flex cursor-pointer items-center gap-2 rounded border px-3 py-2 text-left transition-colors"
            >
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${getBadgeColor()} text-white`}
              >
                Video
              </span>
              <span className="text-secondary-text">Show videos</span>
            </button>
            <button
              onClick={() => onSearchChange("has:audio ")}
              className="border-border-primary hover:border-border-focus bg-secondary-bg hover:bg-primary-bg flex cursor-pointer items-center gap-2 rounded border px-3 py-2 text-left transition-colors"
            >
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${getBadgeColor()} text-white`}
              >
                Audio
              </span>
              <span className="text-secondary-text">Show audio</span>
            </button>
            <button
              onClick={() => onSearchChange("has:image ")}
              className="border-border-primary hover:border-border-focus bg-secondary-bg hover:bg-primary-bg flex cursor-pointer items-center gap-2 rounded border px-3 py-2 text-left transition-colors"
            >
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${getBadgeColor()} text-white`}
              >
                Image
              </span>
              <span className="text-secondary-text">Show images</span>
            </button>
            <button
              onClick={() => onSearchChange("has:mentions ")}
              className="border-border-primary hover:border-border-focus bg-secondary-bg hover:bg-primary-bg flex cursor-pointer items-center gap-2 rounded border px-3 py-2 text-left transition-colors"
            >
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${getBadgeColor()} text-white`}
              >
                Mentions
              </span>
              <span className="text-secondary-text">Show mentions</span>
            </button>
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 ? (
        <div className="border-tertiary-bg bg-secondary-bg absolute z-10 mt-1 w-full rounded-lg border shadow-lg">
          <div className="max-h-[400px] overflow-y-auto">
            {searchResults.map((item) => (
              <button
                key={item.id}
                onClick={() => onChangelogSelect(item.id.toString())}
                className="border-border-primary hover:border-border-focus hover:bg-primary-bg w-full cursor-pointer border-b px-4 py-3 text-left last:border-b-0 focus:outline-none"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span
                    className="text-primary-text font-medium"
                    dangerouslySetInnerHTML={{
                      __html: highlightText(
                        item.title,
                        searchQuery.replace(/^has:\w+\s*/, ""),
                      ),
                    }}
                  />
                  {item.mediaTypes.map((type) => (
                    <span
                      key={type}
                      className={`rounded-full px-2 py-0.5 text-xs ${getBadgeColor()} text-white`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </span>
                  ))}
                </div>
                {item.contentPreview && (
                  <p
                    className="text-secondary-text line-clamp-2 text-sm"
                    dangerouslySetInnerHTML={{
                      __html: highlightText(
                        item.contentPreview,
                        searchQuery.replace(/^has:\w+\s*/, ""),
                      ),
                    }}
                  />
                )}
                {item.mentions.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {item.mentions.map((mention) => (
                      <span
                        key={mention}
                        className={`rounded-full px-2 py-0.5 text-xs ${getBadgeColor()} text-white`}
                      >
                        @{mention}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      ) : (
        searchQuery && (
          <div className="text-secondary-text border-tertiary-bg bg-secondary-bg absolute z-10 mt-1 w-full rounded-lg border p-4 text-center">
            No results found
          </div>
        )
      )}
    </div>
  );
};

export default ChangelogSearchInput;
