"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "nextjs-toploader/app";
import { Icon } from "@/components/ui/IconWrapper";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "sonner";
import { MaxStreamsError } from "@/utils/api/api";
import { useUsernameToId } from "@/hooks/useUsernameToId";
import { trackEvent } from "@/utils/analytics/rybbit";

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
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { getId: getRobloxId } = useUsernameToId();

  const isLoading = isSearching || externalIsLoading;

  useEffect(() => {
    setSearchError(null);
  }, [searchId]);

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
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = searchId.trim();
    if (!input) return;

    trackEvent("Inventory Search", { searchTerm: input });
    setSearchError(null);
    setIsSearching(true);

    if (/^\d+$/.test(input)) {
      router.push(`/inventories/${input}`);
      return;
    }

    try {
      const resolvedId = await getRobloxId(input);
      if (resolvedId) {
        router.push(`/inventories/${input}`);
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

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="relative flex items-center">
          <input
            ref={searchInputRef}
            type="text"
            id="searchInput"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="Search by ID or username..."
            className="border-border-card bg-secondary-bg text-primary-text placeholder-secondary-text focus:border-button-info w-full rounded-lg border px-4 py-3 pr-16 transition-all duration-300 focus:outline-none"
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
      {searchError && (
        <div className="text-primary-text border-button-danger/30 bg-button-danger/10 -mt-4 flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm">
          <Icon
            icon="heroicons:exclamation-circle"
            className="h-4 w-4 shrink-0"
          />
          {searchError}
        </div>
      )}
    </>
  );
}
