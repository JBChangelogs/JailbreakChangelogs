'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RobloxUser } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { hasValidToken } from '@/utils/cookies';
import toast from 'react-hot-toast';
import OGFinderDataStreamer from './OGFinderDataStreamer';
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

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
    history: string | Array<{
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
  isLoading: externalIsLoading 
}: OGFinderClientProps) {
  const [searchId, setSearchId] = useState(robloxId || '');
  const [isLoading, setIsLoading] = useState(externalIsLoading || false);
  const [localRobloxUsers, setLocalRobloxUsers] = useState<Record<string, RobloxUser>>(initialRobloxUsers || {});
  const [localRobloxAvatars, setLocalRobloxAvatars] = useState<Record<string, string>>(initialRobloxAvatars || {});
  const router = useRouter();
  const { isAuthenticated, setShowLoginModal } = useAuth();

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

    // Check if user is authenticated
    if (!isAuthenticated || !hasValidToken()) {
      toast.error('You need to be logged in to use the OG Finder feature.', {
        duration: 4000,
        position: 'bottom-right',
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
                placeholder="Enter username or Roblox ID (e.g., v3kmw or 1910948809)"
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
              disabled={isLoading}
              className="h-10 px-6 bg-[#5865F2] hover:bg-[#4752C4] disabled:bg-[#2E3944] disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 min-w-[100px]"
            >
              {isLoading && (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <span className="whitespace-nowrap">
                {isLoading ? 'Searching...' : 'Search'}
              </span>
            </button>
          </div>
        </form>
      </div>

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
    </div>
  );
}
