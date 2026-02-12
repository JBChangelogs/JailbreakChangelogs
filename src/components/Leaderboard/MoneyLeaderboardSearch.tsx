"use client";

import { useState, useRef, useEffect } from "react";
import { Icon } from "@/components/ui/IconWrapper";
import { useDebounce } from "@/hooks/useDebounce";

interface MoneyLeaderboardSearchProps {
  onSearch: (searchTerm: string) => void;
}

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
        className={`border-border-card bg-secondary-bg text-primary-text placeholder-secondary-text hover:border-border-focus focus:border-button-info w-full rounded-lg border px-4 py-2 pr-10 pl-10 transition-all duration-300 focus:outline-none ${
          isSearchHighlighted
            ? "shadow-button-info/20 border-button-info shadow-lg"
            : ""
        }`}
      />
      <Icon
        icon="heroicons:magnifying-glass"
        className="text-secondary-text absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2"
      />
      {searchTerm && (
        <button
          onClick={() => setSearchTerm("")}
          className="text-secondary-text hover:text-primary-text absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 cursor-pointer"
          aria-label="Clear search"
        >
          <Icon icon="heroicons:x-mark" />
        </button>
      )}
    </div>
  );
}
