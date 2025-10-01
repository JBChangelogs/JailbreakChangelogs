"use client";

import { useState, useRef, useEffect } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useDebounce } from "@/hooks/useDebounce";

interface MoneyLeaderboardSearchProps {
  onSearch: (searchTerm: string) => void;
}

/**
 * Render a debounced search input for the money leaderboard that supports Ctrl/Cmd+F focus and a clear button.
 *
 * Calls `onSearch` with the debounced search string when the user stops typing.
 *
 * @param onSearch - Callback invoked with the current debounced search string
 * @returns The search input React element
 */
export default function MoneyLeaderboardSearch({
  onSearch,
}: MoneyLeaderboardSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchHighlighted, setIsSearchHighlighted] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Handle Ctrl+F to focus search input
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "f") {
        event.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
          // Add visual highlight
          setIsSearchHighlighted(true);
          // Remove highlight after 2 seconds
          setTimeout(() => setIsSearchHighlighted(false), 2000);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Call onSearch when debounced search term changes
  useEffect(() => {
    onSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm, onSearch]);

  return (
    <div className="relative">
      <input
        ref={searchInputRef}
        type="text"
        placeholder="Search players by name or username..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className={`text-primary-text border-border-primary hover:border-border-focus bg-secondary-bg placeholder-secondary-text focus:border-button-info w-full rounded-lg border px-4 py-2 pr-10 pl-10 transition-all duration-300 focus:outline-none ${
          isSearchHighlighted
            ? "border-button-info shadow-button-info/20 shadow-lg"
            : ""
        }`}
      />
      <MagnifyingGlassIcon className="text-secondary-text absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
      {searchTerm && (
        <button
          onClick={() => setSearchTerm("")}
          className="hover:text-primary-text text-secondary-text absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 cursor-pointer"
          aria-label="Clear search"
        >
          <XMarkIcon />
        </button>
      )}
    </div>
  );
}
