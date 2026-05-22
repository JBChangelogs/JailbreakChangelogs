"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/utils/analytics/rybbit";
import { Icon } from "@/components/ui/IconWrapper";
import { Spinner } from "@/components/ui/Spinner";

interface DupeSearchInputProps {
  initialValue?: string;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

export default function DupeSearchInput({
  initialValue = "",
  isLoading = false,
  placeholder = "Enter Roblox ID or username...",
  className = "",
}: DupeSearchInputProps) {
  const [searchId, setSearchId] = useState(initialValue);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSearchId(initialValue);
  }, [initialValue]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const input = searchId.trim();
    if (!input) return;

    trackEvent("Dupe Search", { searchTerm: input });

    setIsSearching(true);
    router.push(`/dupes/${input}`);
  };

  // Use internal loading state or external loading state
  const isCurrentlyLoading = isLoading || isSearching;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "f") {
        event.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <form onSubmit={handleSearch} className={className}>
      <div className="relative flex items-center">
        <input
          ref={searchInputRef}
          type="text"
          id="searchId"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          placeholder={placeholder}
          className="border-border-card bg-secondary-bg text-primary-text placeholder-secondary-text focus:border-button-info w-full rounded-lg border px-4 py-3 pr-16 transition-all duration-300 focus:outline-none"
          disabled={isCurrentlyLoading}
          required
        />

        {/* Right side controls container */}
        <div className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-2">
          {/* Clear button - only show when there's text */}
          {searchId && (
            <button
              type="button"
              onClick={() => setSearchId("")}
              className="text-secondary-text hover:text-primary-text cursor-pointer transition-colors"
              aria-label="Clear search"
            >
              <Icon icon="heroicons:x-mark" className="h-5 w-5" />
            </button>
          )}

          {/* Vertical divider - only show when there's text to clear */}
          {searchId && (
            <div className="border-primary-text h-6 border-l opacity-30"></div>
          )}

          {/* Search button */}
          <button
            type="submit"
            disabled={isCurrentlyLoading || !searchId.trim()}
            className={`flex h-8 w-8 items-center justify-center rounded-md transition-all duration-200 ${
              isCurrentlyLoading
                ? "text-secondary-text cursor-progress"
                : !searchId.trim()
                  ? "text-secondary-text cursor-not-allowed opacity-50"
                  : "hover:bg-button-info/10 text-button-info cursor-pointer"
            }`}
            aria-label="Search"
          >
            {isCurrentlyLoading ? (
              <Spinner className="h-5 w-5" />
            ) : (
              <Icon icon="heroicons:magnifying-glass" className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
