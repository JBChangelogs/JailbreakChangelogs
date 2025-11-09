"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

interface DupeSearchInputProps {
  initialValue?: string;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

export default function DupeSearchInput({
  initialValue = "",
  isLoading = false,
  placeholder = "Enter Roblox ID or username...",
  className = "",
}: DupeSearchInputProps) {
  const [searchId, setSearchId] = useState(initialValue);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = searchId.trim();
    if (!input) return;

    // Check if input is a username (not numeric) and block it
    const isNumeric = /^\d+$/.test(input);
    if (!isNumeric) {
      toast.error(
        "Username searches are temporarily unavailable. Please use User ID instead.",
        {
          duration: 5000,
          position: "bottom-right",
        },
      );
      return;
    }

    setIsSearching(true);
    router.push(`/dupes/${input}`);
  };

  // Use internal loading state or external loading state
  const isCurrentlyLoading = isLoading || isSearching;

  return (
    <form
      onSubmit={handleSearch}
      className={`flex flex-col gap-3 sm:flex-row ${className}`}
    >
      <div className="flex-1">
        <div className="relative">
          <input
            type="text"
            id="searchId"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder={placeholder}
            className="text-primary-text border-border-primary bg-secondary-bg placeholder-secondary-text focus:border-button-info w-full rounded-lg border px-4 py-2 pr-10 pl-10 transition-all duration-300 focus:outline-none"
            disabled={isCurrentlyLoading}
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
          disabled={isCurrentlyLoading || !searchId.trim()}
          className={`text-form-button-text focus:ring-button-info flex h-10 min-w-[100px] items-center justify-center gap-2 rounded-lg px-6 text-sm font-medium transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:outline-none ${
            isCurrentlyLoading
              ? "bg-button-info-disabled cursor-progress"
              : "bg-button-info hover:bg-button-info-hover hover:cursor-pointer"
          }`}
        >
          {isCurrentlyLoading && (
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
            {isCurrentlyLoading ? "Searching..." : "Search"}
          </span>
        </button>
      </div>
    </form>
  );
}
