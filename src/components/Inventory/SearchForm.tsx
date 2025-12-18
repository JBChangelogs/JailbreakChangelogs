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
    <form onSubmit={handleSearch}>
      <div className="relative flex items-center">
        <input
          type="text"
          id="searchInput"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          placeholder="Search by ID or username..."
          className="border-border-primary bg-secondary-bg text-primary-text placeholder-secondary-text focus:border-button-info w-full rounded-lg border px-4 py-3 pr-16 transition-all duration-300 focus:outline-none"
          disabled={isLoading || externalIsLoading}
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
  );
}
