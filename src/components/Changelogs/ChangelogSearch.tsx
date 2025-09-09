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

interface ChangelogSearchProps {
  searchQuery: string;
  searchResults: SearchResult[];
  isSearchFocused: boolean;
  onSearchChange: (query: string) => void;
  onSearchFocus: (focused: boolean) => void;
  onChangelogSelect: (id: string) => void;
}

const ChangelogSearch: React.FC<ChangelogSearchProps> = ({
  searchQuery,
  searchResults,
  isSearchFocused,
  onSearchChange,
  onSearchFocus,
  onChangelogSelect,
}) => {
  return (
    <div className="relative mb-8">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        onFocus={() => onSearchFocus(true)}
        onBlur={() => {
          setTimeout(() => onSearchFocus(false), 200);
        }}
        placeholder="Search changelogs..."
        className="text-muted w-full rounded-lg border border-[#2E3944] bg-[#37424D] px-4 py-2 pr-10 pl-10 placeholder-[#D3D9D4] focus:border-[#124E66] focus:outline-none"
      />
      <div className="absolute top-1/2 left-3 -translate-y-1/2">
        <MagnifyingGlassIcon className="h-5 w-5 text-[#FFFFFF]" />
      </div>
      {searchQuery && (
        <button
          onClick={() => {
            onSearchChange("");
          }}
          className="hover:text-muted absolute top-1/2 right-3 -translate-y-1/2 text-[#FFFFFF]"
          aria-label="Clear search"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      )}

      {/* Quick Filter Buttons */}
      {isSearchFocused && !searchQuery && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-[#2E3944] bg-[#212A31] p-2 shadow-lg">
          <div className="flex flex-col gap-1">
            <button
              onClick={() => onSearchChange("has:video ")}
              className="flex items-center gap-2 rounded border border-[#37424D] bg-[#2E3944] px-3 py-2 text-left transition-colors hover:bg-[#37424D]"
            >
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${getBadgeColor("video")} text-white`}
              >
                Video
              </span>
              <span className="text-muted">Show videos</span>
            </button>
            <button
              onClick={() => onSearchChange("has:audio ")}
              className="flex items-center gap-2 rounded border border-[#37424D] bg-[#2E3944] px-3 py-2 text-left transition-colors hover:bg-[#37424D]"
            >
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${getBadgeColor("audio")} text-white`}
              >
                Audio
              </span>
              <span className="text-muted">Show audio</span>
            </button>
            <button
              onClick={() => onSearchChange("has:image ")}
              className="flex items-center gap-2 rounded border border-[#37424D] bg-[#2E3944] px-3 py-2 text-left transition-colors hover:bg-[#37424D]"
            >
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${getBadgeColor("image")} text-white`}
              >
                Image
              </span>
              <span className="text-muted">Show images</span>
            </button>
            <button
              onClick={() => onSearchChange("has:mentions ")}
              className="flex items-center gap-2 rounded border border-[#37424D] bg-[#2E3944] px-3 py-2 text-left transition-colors hover:bg-[#37424D]"
            >
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${getBadgeColor("mentions")} text-white`}
              >
                Mentions
              </span>
              <span className="text-muted">Show mentions</span>
            </button>
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 ? (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-[#2E3944] bg-[#212A31] shadow-lg">
          <div className="max-h-[400px] overflow-y-auto">
            {searchResults.map((item) => (
              <button
                key={item.id}
                onClick={() => onChangelogSelect(item.id.toString())}
                className="w-full border-b border-[#2E3944] px-4 py-3 text-left last:border-b-0 hover:bg-[#2B2F4C] focus:outline-none"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span
                    className="text-muted font-medium"
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
                      className={`rounded-full px-2 py-0.5 text-xs ${getBadgeColor(type)} text-white`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </span>
                  ))}
                </div>
                {item.contentPreview && (
                  <p
                    className="line-clamp-2 text-sm text-[#FFFFFF]"
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
                        className={`rounded-full px-2 py-0.5 text-xs ${getBadgeColor("mentions")} text-white`}
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
          <div className="text-muted absolute z-10 mt-1 w-full rounded-lg border border-[#2E3944] bg-[#212A31] p-4 text-center">
            No results found
          </div>
        )
      )}
    </div>
  );
};

export default ChangelogSearch;
