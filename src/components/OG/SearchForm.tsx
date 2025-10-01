"use client";

import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface SearchFormProps {
  searchId: string;
  setSearchId: (value: string) => void;
  handleSearch: (e: React.FormEvent) => void;
  isLoading: boolean;
  externalIsLoading: boolean;
}

export default function SearchForm({
  searchId,
  setSearchId,
  handleSearch,
  isLoading,
  externalIsLoading,
}: SearchFormProps) {
  return (
    <>
      <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              id="searchInput"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Enter username or Roblox ID (e.g., Jakobiis or 1910948809)"
              className="text-primary-text border-border-primary bg-secondary-bg placeholder-secondary-text focus:border-button-info w-full rounded-lg border px-4 py-2 pr-10 pl-10 transition-all duration-300 focus:outline-none"
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
            disabled={isLoading || externalIsLoading}
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
    </>
  );
}
