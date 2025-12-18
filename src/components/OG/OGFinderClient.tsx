"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RobloxUser } from "@/types";
import { useAuthContext } from "@/contexts/AuthContext";
import { useUsernameToId } from "@/hooks/useUsernameToId";
import toast from "react-hot-toast";
import OGFinderDataStreamer from "./OGFinderDataStreamer";
import {
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

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
  const router = useRouter();
  const { isAuthenticated, setShowLoginModal } = useAuthContext();
  const { getId } = useUsernameToId();

  // Compute loading state during render
  const isLoading = externalIsLoading || isSearching;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = searchId.trim();
    if (!input) return;

    // Check if user is authenticated before navigation
    if (!isAuthenticated) {
      toast.error("You need to be logged in to use the OG Finder feature.", {
        duration: 4000,
        position: "bottom-right",
      });
      setShowLoginModal(true);
      return;
    }

    setIsSearching(true);
    const isNumeric = /^\d+$/.test(input);
    const id = isNumeric ? input : await getId(input);
    router.push(`/og/${id ?? input}`);
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <form onSubmit={handleSearch}>
        <div className="relative flex items-center">
          <input
            type="text"
            id="searchId"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="Search by ID or username..."
            className="border-border-primary bg-secondary-bg text-primary-text placeholder-secondary-text focus:border-button-info w-full rounded-lg border px-4 py-3 pr-16 transition-all duration-300 focus:outline-none"
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
                <XMarkIcon className="h-5 w-5" />
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
                <MagnifyingGlassIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Results */}
      {robloxId && <OGFinderDataStreamer robloxId={robloxId} />}

      {/* Error Display */}
      {error && !initialData && (
        <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-6">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="bg-status-error/10 rounded-full p-3">
                <ExclamationTriangleIcon className="text-status-error h-8 w-8" />
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
    </div>
  );
}
