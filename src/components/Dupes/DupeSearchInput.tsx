"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/IconWrapper";
import { useUsernameToId } from "@/hooks/useUsernameToId";
import { MaxStreamsError } from "@/utils/api";
import toast from "react-hot-toast";

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
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  const { getId } = useUsernameToId();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = searchId.trim();
    if (!input) return;

    setIsSearching(true);
    try {
      const isNumeric = /^\d+$/.test(input);
      const id = isNumeric ? input : await getId(input);
      router.push(`/dupes/${id ?? input}`);
    } catch (error) {
      console.error("Error searching for user:", error);

      // Check for max streams error - this is a temporary server issue
      if (error instanceof MaxStreamsError) {
        toast.error(
          "Unable to search by username at this time due to a temporary server issue. Please use the user's Roblox ID to search instead.",
          {
            duration: 6000,
            position: "bottom-right",
          },
        );
      } else {
        toast.error(
          "Failed to find user. Please check the spelling and try again, or try searching by Roblox ID instead.",
          {
            duration: 5000,
            position: "bottom-right",
          },
        );
      }
    } finally {
      setIsSearching(false);
    }
  };

  // Use internal loading state or external loading state
  const isCurrentlyLoading = isLoading || isSearching;

  return (
    <form onSubmit={handleSearch} className={className}>
      <div className="relative flex items-center">
        <input
          type="text"
          id="searchId"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          placeholder={placeholder}
          className="border-border-primary bg-secondary-bg text-primary-text placeholder-secondary-text focus:border-button-info w-full rounded-lg border px-4 py-3 pr-16 transition-all duration-300 focus:outline-none"
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
              <svg
                className="h-5 w-5 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <Icon icon="heroicons:magnifying-glass" className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
