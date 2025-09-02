import { Suspense } from 'react';
import { fetchInventoryData, fetchRobloxUserByUsername } from '@/utils/api';
import InventoryCheckerClient from './InventoryCheckerClient';
import UserDataStreamer from './UserDataStreamer';

interface InventoryDataStreamerProps {
  robloxId: string;
}

// Loading component for inventory data
function InventoryLoadingFallback({ robloxId }: { robloxId: string }) {
  return (
    <div className="space-y-6">
      <div className="bg-[#212A31] rounded-lg border border-[#2E3944] p-6">
        <form className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-muted mb-2">
              Username or Roblox ID
            </label>
            <input
              type="text"
              value={robloxId}
              readOnly
              className="w-full px-3 py-2 border border-[#2E3944] bg-[#37424D] rounded-lg shadow-sm text-muted"
            />
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
      
      <div className="bg-[#212A31] rounded-lg border border-[#2E3944] p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-[#37424D] rounded-full animate-pulse"></div>
          <div className="flex-1">
            <div className="h-6 bg-[#37424D] rounded animate-pulse mb-2"></div>
            <div className="h-4 bg-[#37424D] rounded animate-pulse w-1/2"></div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="text-center">
              <div className="h-4 bg-[#37424D] rounded animate-pulse mb-2"></div>
              <div className="h-8 bg-[#37424D] rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Component that fetches inventory data
async function InventoryDataFetcher({ robloxId }: { robloxId: string }) {
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
          <InventoryCheckerClient 
            robloxId={robloxId} 
            error={`Username "${robloxId}" not found. Please check the spelling and try again.`} 
          />
        );
      }
    } catch (error) {
      console.error('Error fetching user by username:', error);
      return (
        <InventoryCheckerClient 
          robloxId={robloxId} 
          error={`Failed to find user "${robloxId}". Please check the spelling and try again.`} 
        />
      );
    }
  }

  const result = await fetchInventoryData(actualRobloxId);

  // Check if the result contains an error
  if (result && 'error' in result) {
    return (
      <InventoryCheckerClient 
        robloxId={actualRobloxId} 
        error={result.message}
      />
    );
  }

  // Check if no data was returned
  if (!result) {
    return (
      <InventoryCheckerClient 
        robloxId={actualRobloxId} 
        error="Failed to fetch inventory data. Please try again." 
      />
    );
  }

  return (
    <Suspense fallback={<InventoryCheckerClient robloxId={actualRobloxId} initialData={result} isLoading={true} />}>
      <UserDataStreamer robloxId={actualRobloxId} inventoryData={result} />
    </Suspense>
  );
}

export default function InventoryDataStreamer({ robloxId }: InventoryDataStreamerProps) {
  return (
    <Suspense fallback={<InventoryLoadingFallback robloxId={robloxId} />}>
      <InventoryDataFetcher robloxId={robloxId} />
    </Suspense>
  );
}
