"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import DupeFinderResults from "./DupeFinderResults";
import type { DupeFinderItem, RobloxUser } from "@/types";

interface DupeFinderClientProps {
  initialData?: DupeFinderItem[];
  robloxId?: string;
  robloxUsers?: Record<string, RobloxUser>;
  robloxAvatars?: Record<string, string>;
  error?: string;
  isLoading?: boolean;
}

export default function DupeFinderClient({
  initialData,
  robloxId,
  robloxUsers: initialRobloxUsers,
  robloxAvatars: initialRobloxAvatars,
  error,
  isLoading: externalIsLoading,
}: DupeFinderClientProps) {
  const [searchId, setSearchId] = useState(robloxId || "");
  const [isLoading, setIsLoading] = useState(externalIsLoading || false);
  const [localRobloxUsers, setLocalRobloxUsers] = useState<
    Record<string, RobloxUser>
  >(initialRobloxUsers || {});
  const [localRobloxAvatars, setLocalRobloxAvatars] = useState<
    Record<string, string>
  >(initialRobloxAvatars || {});
  const router = useRouter();

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
  }, [initialData, error, externalIsLoading]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;

    setIsLoading(true);
    router.push(`/dupes/${searchId.trim()}`);
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-6 shadow-sm">
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label
              htmlFor="searchId"
              className="text-muted mb-2 block text-sm font-medium"
            >
              Roblox ID or Username
            </label>
            <div className="relative">
              <input
                type="text"
                id="searchId"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Enter Roblox ID or username..."
                className="text-muted w-full rounded-lg border border-[#2E3944] bg-[#37424D] px-4 py-2 pr-10 pl-10 placeholder-[#D3D9D4] focus:border-[#124E66] focus:outline-none"
                required
              />
              <MagnifyingGlassIcon className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-[#FFFFFF]" />
              {searchId && (
                <button
                  type="button"
                  onClick={() => setSearchId("")}
                  className="hover:text-muted absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 text-[#FFFFFF]"
                  aria-label="Clear search"
                >
                  <XMarkIcon />
                </button>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !searchId.trim()}
            className="w-full rounded-lg bg-[#5865F2] px-4 py-3 text-white transition-colors duration-200 hover:bg-[#4752C4] focus:ring-2 focus:ring-[#5865F2] focus:ring-offset-2 focus:ring-offset-[#212A31] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Searching..." : "Find Dupes"}
          </button>
        </form>
      </div>

      {/* Results */}
      {initialData && (
        <DupeFinderResults
          initialData={initialData}
          robloxId={robloxId}
          robloxUsers={localRobloxUsers}
          robloxAvatars={localRobloxAvatars}
          error={error}
        />
      )}

      {/* Error Display */}
      {error && !initialData && (
        <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-6 shadow-sm">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-red-500/10 p-3">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-400" />
              </div>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-red-400">
              User Not Found
            </h3>
            <p className="text-gray-300">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
