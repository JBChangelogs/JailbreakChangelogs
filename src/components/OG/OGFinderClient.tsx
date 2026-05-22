"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/utils/analytics";
import { RobloxUser } from "@/types";
import OGFinderDataStreamer from "./OGFinderDataStreamer";
import { Icon } from "@/components/ui/IconWrapper";
import OGNotificationSheet from "./OGNotificationSheet";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/Spinner";

interface OGSearchData {
  results: Array<{
    tradePopularMetric: number;
    level: number | null;
    timesTraded: number;
    id: string;
    categoryTitle: string;
    info: Array<{
      title: string;
      value: string;
    }>;
    uniqueCirculation: number;
    season: number | null;
    title: string;
    isOriginalOwner: boolean;
    user_id: string;
    logged_at: number;
    history:
      | string
      | Array<{
          UserId: number;
          TradeTime: number;
        }>;
  }>;
  count: number;
}

interface OGFinderClientProps {
  initialData?: OGSearchData;
  robloxId?: string;
  originalSearchTerm?: string;
  robloxUsers?: Record<string, RobloxUser>;
  error?: string;
  isLoading?: boolean;
}

export default function OGFinderClient({
  initialData,
  robloxId,
  error,
  isLoading: externalIsLoading,
}: OGFinderClientProps) {
  const [searchId, setSearchId] = useState(robloxId || "");
  const [isSearching, setIsSearching] = useState(false);
  const [showNotificationSheet, setShowNotificationSheet] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Compute loading state during render
  const isLoading = externalIsLoading || isSearching;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const input = searchId.trim();
    if (!input) return;

    trackEvent("OG Search", { searchTerm: input });

    setIsSearching(true);
    router.push(`/og/${input}`);
  };

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
    <div className="space-y-6">
      {/* Search Form and Notification Button */}
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <form onSubmit={handleSearch}>
            <div className="relative flex items-center">
              <input
                ref={searchInputRef}
                type="text"
                id="searchId"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Search by ID or username..."
                className="border-border-card bg-secondary-bg text-primary-text placeholder-secondary-text focus:border-button-info w-full rounded-lg border px-4 py-3 pr-16 transition-all duration-300 focus:outline-none"
                disabled={isLoading}
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
                  disabled={isLoading || externalIsLoading || !searchId.trim()}
                  className={`flex h-8 w-8 items-center justify-center rounded-md transition-all duration-200 ${
                    isLoading || externalIsLoading
                      ? "text-secondary-text cursor-progress"
                      : !searchId.trim()
                        ? "text-secondary-text cursor-not-allowed opacity-50"
                        : "hover:bg-button-info/10 text-button-info cursor-pointer"
                  }`}
                  aria-label="Search"
                >
                  {isLoading || externalIsLoading ? (
                    <Spinner className="h-5 w-5" />
                  ) : (
                    <Icon
                      icon="heroicons:magnifying-glass"
                      className="h-5 w-5"
                    />
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
        <Button
          onClick={() => {
            setShowNotificationSheet(true);
            trackEvent("Open OG Notification Sheet");
          }}
          variant="default"
          size="lg"
          title="Get Notified"
        >
          <span className="flex items-center gap-2">
            <Icon
              icon="material-symbols:notifications-outline"
              className="h-5 w-5"
            />
            <span className="hidden sm:inline">Get Notified</span>
          </span>
        </Button>
      </div>
      <div className="text-secondary-text mt-2 hidden items-center gap-1 text-xs lg:flex">
        <Icon icon="emojione:light-bulb" className="text-sm text-yellow-500" />
        Helpful tip: Press{" "}
        <kbd className="kbd kbd-sm border-border-card bg-tertiary-bg text-primary-text">
          Ctrl
        </kbd>
        {" + "}
        <kbd className="kbd kbd-sm border-border-card bg-tertiary-bg text-primary-text">
          F
        </kbd>{" "}
        to quickly focus the search.
      </div>

      {/* Results */}
      {robloxId && <OGFinderDataStreamer robloxId={robloxId} />}

      {/* Error Display */}
      {error && !initialData && (
        <div className="border-border-card bg-secondary-bg shadow-card-shadow rounded-lg border p-6">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="bg-status-error/10 rounded-full p-3">
                <Icon
                  icon="heroicons:exclamation-triangle"
                  className="text-status-error h-8 w-8"
                />
              </div>
            </div>
            <h3 className="text-status-error mb-2 text-lg font-semibold">
              {error.includes("Server error")
                ? "Server Error"
                : "User Not Found"}
            </h3>
            <p className="text-secondary-text">{error}</p>
          </div>
        </div>
      )}

      {/* OG Notification Sheet */}
      <OGNotificationSheet
        isOpen={showNotificationSheet}
        onClose={() => setShowNotificationSheet(false)}
      />
    </div>
  );
}
