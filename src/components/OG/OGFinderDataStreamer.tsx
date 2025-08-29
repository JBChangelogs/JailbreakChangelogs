import { Suspense } from 'react';
import { fetchOGSearchData, fetchRobloxUserByUsername, fetchRobloxUsersBatch, fetchRobloxAvatars } from '@/utils/api';
import { RobloxUser } from '@/types';
import OGFinderResults from './OGFinderResults';

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

interface OGFinderDataStreamerProps {
  robloxId: string;
  originalSearchTerm?: string;
  initialData?: OGSearchData;
  robloxUsers?: Record<string, RobloxUser>;
  robloxAvatars?: Record<string, string>;
  error?: string;
  isLoading?: boolean;
}

// Loading fallback component
function OGFinderLoadingFallback({ robloxId }: { robloxId: string }) {
  return (
    <div className="space-y-6">
      {/* Search Form */}
      <div className="bg-[#212A31] rounded-lg border border-[#2E3944] p-6">
        <form className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label htmlFor="searchInput" className="block text-sm font-medium text-muted mb-2">
              Username or Roblox ID
            </label>
            <div className="relative">
              <input
                type="text"
                id="searchInput"
                value={robloxId}
                readOnly
                className="w-full rounded-lg border border-[#2E3944] bg-[#37424D] px-4 py-2 pl-10 pr-10 text-muted"
              />
              <svg className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#FFFFFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div className="flex items-end">
            <button
              disabled
              className="h-10 px-6 bg-[#2E3944] text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 min-w-[100px] cursor-not-allowed"
            >
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="whitespace-nowrap">Fetching...</span>
            </button>
          </div>
        </form>
      </div>
      
      <div className="bg-[#212A31] rounded-lg p-6 shadow-sm border border-[#2E3944]">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-600 rounded-full"></div>
            <div className="flex-1">
              <div className="h-6 bg-gray-600 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-600 rounded w-24"></div>
            </div>
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-[#2E3944] rounded-lg">
                <div className="w-12 h-12 bg-gray-600 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-600 rounded w-48"></div>
                  <div className="h-3 bg-gray-600 rounded w-32"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Component that fetches OG search data
async function OGFinderDataFetcher({ robloxId }: { robloxId: string }) {
  // Check if the input is a username (not a number) or a Roblox ID
  const isUsername = !/^\d+$/.test(robloxId);
  
  let actualRobloxId = robloxId;
  
  // If it's a username, try to get the Roblox ID first
  if (isUsername) {
    try {
      const userData = await fetchRobloxUserByUsername(robloxId);
      if (userData && userData.id) {
        actualRobloxId = userData.id.toString();
      } else {
        return (
          <OGFinderResults 
            robloxId={robloxId} 
            error={`Username "${robloxId}" not found. Please check the spelling and try again.`} 
          />
        );
      }
    } catch (error) {
      console.error('Error fetching user by username:', error);
      return (
        <OGFinderResults 
          robloxId={robloxId} 
          error={`Failed to find user "${robloxId}". Please check the spelling and try again.`} 
        />
      );
    }
  }

  const result = await fetchOGSearchData(actualRobloxId);



  // Check if the result contains an error
  if (result && 'error' in result) {
    return (
      <OGFinderResults 
        robloxId={actualRobloxId} 
        error={result.message} 
      />
    );
  }

  // Check if no data was returned
  if (!result) {
    return (
      <OGFinderResults 
        robloxId={actualRobloxId} 
        error="Failed to fetch OG search data. Please try again." 
      />
    );
  }

  // Get the main user's data
  const mainUserData = await fetchRobloxUsersBatch([actualRobloxId]).catch(error => {
    console.error('Failed to fetch main user data:', error);
    return {};
  });
  
  const mainUserAvatar = await fetchRobloxAvatars([actualRobloxId]).catch(error => {
    console.error('Failed to fetch main user avatar:', error);
    return {};
  });

  // Build the user data objects with just the main user
  const robloxUsers: Record<string, RobloxUser> = {};
  const robloxAvatars: Record<string, string> = {};

  // Add main user data
  if (mainUserData && typeof mainUserData === 'object') {
    Object.values(mainUserData).forEach((userData) => {
      const user = userData as { id: number; name: string; displayName: string; username: string; hasVerifiedBadge: boolean };
      if (user && user.id) {
        robloxUsers[user.id.toString()] = {
          id: user.id,
          name: user.name,
          displayName: user.displayName,
          username: user.username
        };
      }
    });
  }

  // Add main user avatar
  if (mainUserAvatar && typeof mainUserAvatar === 'object') {
    Object.values(mainUserAvatar).forEach((avatar) => {
      const avatarData = avatar as { targetId: number; state: string; imageUrl?: string; version: string };
      if (avatarData && avatarData.targetId && avatarData.state === 'Completed' && avatarData.imageUrl) {
        robloxAvatars[avatarData.targetId.toString()] = avatarData.imageUrl;
      }
    });
  }

  return (
    <OGFinderResults 
      initialData={result} 
      robloxId={actualRobloxId} 
      robloxUsers={robloxUsers} 
      robloxAvatars={robloxAvatars}
    />
  );
}

export default function OGFinderDataStreamer({ robloxId }: OGFinderDataStreamerProps) {
  return (
    <Suspense fallback={<OGFinderLoadingFallback robloxId={robloxId} />}>
      <OGFinderDataFetcher robloxId={robloxId} />
    </Suspense>
  );
}
