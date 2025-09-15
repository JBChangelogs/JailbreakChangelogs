"use client";

import { useState, useRef, useEffect } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
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
    <div className="mb-6">
      <div className="relative">
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search players by name or username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`text-muted w-full rounded-lg border px-4 py-2 pr-10 pl-10 placeholder-[#D3D9D4] transition-all duration-300 focus:outline-none ${
            isSearchHighlighted
              ? "border-[#124E66] bg-[#1A5F7A] shadow-lg shadow-[#124E66]/20"
              : "border-[#2E3944] bg-[#37424D] focus:border-[#124E66]"
          }`}
        />
        <MagnifyingGlassIcon className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-[#FFFFFF]" />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="hover:text-muted absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 text-[#FFFFFF]"
            aria-label="Clear search"
          >
            <XMarkIcon />
          </button>
        )}
      </div>
    </div>
  );
}
