"use client";

import { isItemSearchShortcut } from "@/utils/ui/searchShortcut";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "nextjs-toploader/app";
import { Icon } from "@/components/ui/IconWrapper";
import { Spinner } from "@/components/ui/Spinner";
import { trackEvent } from "@/utils/analytics/rybbit";
import { trackWebEvent } from "@/utils/analytics/web";

interface SearchFormProps {
  searchId: string;
  setSearchId: (value: string) => void;
  externalIsLoading: boolean;
}

export default function SearchForm({
  searchId,
  setSearchId,
  externalIsLoading,
}: SearchFormProps) {
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const isLoading = isSearching || externalIsLoading;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isItemSearchShortcut(event) && searchInputRef.current) {
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
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = searchId.trim();
    if (!input) return;

    trackWebEvent("inventory_search", {
      input_type: /^\d+$/.test(input) ? "id" : "username",
    });
    trackEvent("Inventory Search", { searchTerm: input });
    setIsSearching(true);

    router.push(`/inventories/${encodeURIComponent(input)}`);
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="relative flex items-center">
          <input
            ref={searchInputRef}
            aria-keyshortcuts="/"
            type="search"
            id="inventory-search"
            name="inventory-search"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="Search by ID or username..."
            className="border-border-card bg-secondary-bg text-primary-text placeholder-secondary-text focus:border-button-info w-full rounded-lg border px-4 py-3 pr-16 transition-all duration-300 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
            disabled={isLoading}
            required
          />

          <div className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-2">
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

            {searchId && (
              <div className="border-primary-text h-6 border-l opacity-30"></div>
            )}

            <button
              type="submit"
              disabled={isLoading || !searchId.trim()}
              className={`flex h-8 w-8 items-center justify-center rounded-md transition-all duration-200 ${
                isLoading
                  ? "text-secondary-text cursor-progress"
                  : !searchId.trim()
                    ? "text-secondary-text cursor-not-allowed opacity-50"
                    : "hover:bg-link/10 text-link cursor-pointer"
              }`}
              aria-label="Search"
            >
              {isLoading ? (
                <Spinner className="h-5 w-5" />
              ) : (
                <Icon icon="heroicons:magnifying-glass" className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
