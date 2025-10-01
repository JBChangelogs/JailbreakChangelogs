"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RobloxUser } from "@/types";
import { useAuthContext } from "@/contexts/AuthContext";
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
  robloxAvatars?: Record<string, string>;
  error?: string;
  isLoading?: boolean;
}

export default function OGFinderClient({
  initialData,
  robloxId,
  originalSearchTerm,
  robloxUsers: initialRobloxUsers,
  robloxAvatars: initialRobloxAvatars,
  error,
  isLoading: externalIsLoading,
}: OGFinderClientProps) {
  const [searchId, setSearchId] = useState(robloxId || "");
  const [isLoading, setIsLoading] = useState(externalIsLoading || false);
  const [localRobloxUsers, setLocalRobloxUsers] = useState<
    Record<string, RobloxUser>
  >(initialRobloxUsers || {});
  const [localRobloxAvatars, setLocalRobloxAvatars] = useState<
    Record<string, string>
  >(initialRobloxAvatars || {});
  const router = useRouter();
  const { isAuthenticated, setShowLoginModal } = useAuthContext();

  // Update local state when props change
  useEffect(() => {
    setLocalRobloxUsers(initialRobloxUsers || {});
  }, [initialRobloxUsers]);

  useEffect(() => {
    setLocalRobloxAvatars(initialRobloxAvatars || {});
  }, [initialRobloxAvatars]);

  // Reset loading state when new data is received or when there's an error
  useEffect(() => {
    if (initialData || error) {
      setIsLoading(false);
    }
  }, [initialData, error]);

  // Sync with external loading state
  useEffect(() => {
    setIsLoading(externalIsLoading || false);
  }, [externalIsLoading]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;

    // Check if user is authenticated before navigation
    if (!isAuthenticated) {
      toast.error("You need to be logged in to use the OG Finder feature.", {
        duration: 4000,
        position: "bottom-right",
      });
      setShowLoginModal(true);
      return;
    }

    setIsLoading(true);
    router.push(`/og/${searchId.trim()}`);
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              id="searchId"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Enter Roblox ID or username..."
              className="text-primary-text border-border-primary bg-secondary-bg placeholder-secondary-text focus:border-button-info w-full rounded-lg border px-4 py-2 pr-10 pl-10 transition-all duration-300 focus:outline-none"
              disabled={isLoading}
              required
            />
            <MagnifyingGlassIcon className="text-secondary-text absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
            {searchId && (
              <button
                type="button"
                onClick={() => setSearchId("")}
                className="hover:text-primary-text text-secondary-text absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 cursor-pointer"
                aria-label="Clear search"
              >
                <XMarkIcon />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={isLoading || externalIsLoading || !searchId.trim()}
            className={`flex h-10 min-w-[100px] items-center justify-center gap-2 rounded-lg px-6 text-sm font-medium transition-all duration-200 ${
              isLoading || externalIsLoading
                ? "bg-button-info-disabled text-form-button-text border-button-info-disabled cursor-progress"
                : "bg-button-info text-form-button-text hover:bg-button-info-hover cursor-pointer"
            }`}
          >
            {(isLoading || externalIsLoading) && (
              <svg
                className="h-4 w-4 animate-spin"
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
            )}
            <span className="whitespace-nowrap">
              {isLoading || externalIsLoading ? "Searching..." : "Search"}
            </span>
          </button>
        </div>
      </form>

      {/* Results */}
      {robloxId && (
        <OGFinderDataStreamer
          robloxId={robloxId}
          originalSearchTerm={originalSearchTerm}
          initialData={initialData}
          robloxUsers={localRobloxUsers}
          robloxAvatars={localRobloxAvatars}
          error={error}
          isLoading={isLoading}
        />
      )}

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
