'use client';

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
  externalIsLoading
}: SearchFormProps) {
  return (
    <div className="bg-[#212A31] rounded-lg border border-[#2E3944] p-6">
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label htmlFor="searchInput" className="block text-sm font-medium text-muted mb-2">
            Username or Roblox ID
          </label>
          <div className="relative">
            <input
              type="text"
              id="searchInput"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Enter username or Roblox ID (e.g., Jakobiis or 1910948809)"
              className="w-full rounded-lg border border-[#2E3944] bg-[#37424D] px-4 py-2 pl-10 pr-10 text-muted placeholder-[#D3D9D4] focus:border-[#124E66] focus:outline-none"
              required
            />
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#FFFFFF]" />
            {searchId && (
              <button
                type="button"
                onClick={() => setSearchId("")}
                className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#FFFFFF] hover:text-muted"
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
            className="h-10 px-6 bg-[#5865F2] hover:bg-[#4752C4] disabled:bg-[#2E3944] disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 min-w-[100px]"
          >
            {(isLoading || externalIsLoading) && (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            <span className="whitespace-nowrap">
              {isLoading || externalIsLoading ? 'Searching...' : 'Search'}
            </span>
          </button>
        </div>
      </form>
      
    </div>
  );
}
