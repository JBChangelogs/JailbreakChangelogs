"use client";

import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface SearchFormProps {
  searchId: string;
  setSearchId: (value: string) => void;
  handleSearch: (e: React.FormEvent) => void;
  isLoading: boolean;
  externalIsLoading: boolean;
  error?: string;
}

export default function SearchForm({
  searchId,
  setSearchId,
  handleSearch,
  isLoading,
  externalIsLoading,
  error,
}: SearchFormProps) {
  return (
    <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-6">
      <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label
            htmlFor="searchInput"
            className="text-muted mb-2 block text-sm font-medium"
          >
            Username or Roblox ID
          </label>
          <div className="relative">
            <input
              type="text"
              id="searchInput"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Enter username or Roblox ID (e.g., Jakobiis or 1910948809)"
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
        <div className="flex items-end">
          <button
            type="submit"
            disabled={isLoading || externalIsLoading}
            className="flex h-10 min-w-[100px] items-center justify-center gap-2 rounded-lg bg-[#5865F2] px-6 text-sm font-medium text-white transition-all duration-200 hover:bg-[#4752C4] disabled:cursor-not-allowed disabled:bg-[#2E3944]"
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

      {/* Error Message */}
      {error && (
        <div className="mt-4 rounded-lg border border-red-500/50 bg-red-900/30 p-3">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}
    </div>
  );
}
