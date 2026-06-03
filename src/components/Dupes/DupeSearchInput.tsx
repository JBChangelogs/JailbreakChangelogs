"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "nextjs-toploader/app";
import { trackEvent } from "@/utils/analytics/rybbit";
import { Icon } from "@/components/ui/IconWrapper";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "sonner";
import { MaxStreamsError } from "@/utils/api/api";
import { useUsernameToId } from "@/hooks/useUsernameToId";

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
  const [searchError, setSearchError] = useState<string | null>(null);
  const router = useRouter();
  const { getId: getRobloxId } = useUsernameToId();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = searchId.trim();
    if (!input) return;

    trackEvent("Dupe Search", { searchTerm: input });
    setSearchError(null);

    const isUsername = !/^\d+$/.test(input);
    if (!isUsername) {
      setIsSearching(true);
      router.push(`/dupes/${input}`);
      return;
    }

    setIsSearching(true);
    try {
      const resolvedId = await getRobloxId(input);
      if (resolvedId) {
        router.push(`/dupes/${resolvedId}`);
      } else {
        setIsSearching(false);
        const truncated =
          input.length > 50 ? `${input.substring(0, 47)}...` : input;
        const msg = `Username "${truncated}" not found. Please check the spelling and try again.`;
        toast.error(msg);
        setSearchError(msg);
      }
    } catch (err) {
      setIsSearching(false);
      const msg =
        err instanceof MaxStreamsError
          ? "Unable to search by username at this time. Please use the Roblox ID instead."
          : "Server error while looking up username. Please try searching by Roblox ID instead.";
      toast.error(msg);
      setSearchError(msg);
    }
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
    <div className={className}>
      <form onSubmit={handleSearch}>
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
                    : "hover:bg-link/10 text-link cursor-pointer"
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
      {searchError && (
        <div className="text-primary-text border-button-danger/30 bg-button-danger/10 mt-2 flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm">
          <Icon
            icon="heroicons:exclamation-circle"
            className="h-4 w-4 shrink-0"
          />
          {searchError}
        </div>
      )}
    </div>
  );
}
