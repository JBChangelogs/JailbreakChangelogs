import { Suspense } from 'react';
import { fetchRobloxUsersBatch, fetchRobloxAvatars } from '@/utils/api';
import InventoryCheckerClient from './InventoryCheckerClient';
import { RobloxUser } from '@/types';

interface InventoryItem {
  tradePopularMetric: number | null;
  item_id: number;
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
  history?: Array<{
    UserId: number;
    TradeTime: number;
  }>;
}

interface InventoryData {
  user_id: string;
  data: InventoryItem[];
  item_count: number;
  level: number;
  money: number;
  xp: number;
  gamepasses: string[];
  has_season_pass: boolean;
  job_id: string;
  bot_id: string;
  scan_count: number;
  created_at: number;
  updated_at: number;
}

interface UserDataStreamerProps {
  robloxId: string;
  inventoryData: InventoryData;
}

// Loading component for user data
function UserDataLoadingFallback({ robloxId, inventoryData }: UserDataStreamerProps) {
  return (
    <div className="space-y-6">
      {/* Search Form */}
      <div className="bg-[#212A31] rounded-lg border border-[#2E3944] p-6">
        <form className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={robloxId}
              readOnly
              className="w-full px-3 py-2 border border-[#2E3944] bg-[#37424D] rounded-lg shadow-sm text-muted"
            />
          </div>
          <button
            disabled
            className="bg-[#2E3944] text-white font-medium py-2 px-6 rounded-lg flex items-center gap-2 sm:w-auto w-full"
          >
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading User Data...
          </button>
        </form>
      </div>

      {/* User Stats with Inventory Data */}
      <div className="bg-[#212A31] rounded-lg border border-[#2E3944] p-6">
        <h2 className="text-xl font-semibold mb-4 text-muted">User Information</h2>
        
        {/* Roblox User Profile - Loading State */}
        <div className="flex items-center gap-4 mb-6 p-4 bg-[#2E3944] rounded-lg border border-[#37424D]">
          <div className="w-16 h-16 bg-[#37424D] rounded-full animate-pulse"></div>
          <div className="flex-1">
            <div className="h-6 bg-[#37424D] rounded animate-pulse mb-2"></div>
            <div className="h-4 bg-[#37424D] rounded animate-pulse w-1/3"></div>
            <div className="h-4 bg-[#37424D] rounded animate-pulse w-1/4 mt-2"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-sm text-muted">Total Items</div>
            <div className="text-2xl font-bold text-white">{inventoryData.item_count}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted">Original Items</div>
            <div className="text-2xl font-bold text-[#4ade80]">{inventoryData.data.filter((item: InventoryItem) => item.isOriginalOwner).length}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted">Non-Original</div>
            <div className="text-2xl font-bold text-[#ff6b6b]">{inventoryData.data.filter((item: InventoryItem) => !item.isOriginalOwner).length}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted">Level</div>
            <div className="text-2xl font-bold text-white">{inventoryData.level}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted">Money</div>
            <div className="text-2xl font-bold text-[#4ade80]">${inventoryData.money.toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted">XP</div>
            <div className="text-2xl font-bold text-white">{inventoryData.xp.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Inventory Items - Show with loading state for user data */}
      <div className="bg-[#212A31] rounded-lg border border-[#2E3944] p-6">
        <h2 className="text-xl font-semibold text-muted mb-4">Inventory Items</h2>
        
        <div className="flex justify-center items-center py-8">
          <div className="flex flex-col items-center gap-4">
            <svg className="animate-spin h-8 w-8 text-[#5865F2]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-muted text-sm">Loading user profiles and avatars...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component that fetches user data in parallel with optimized batching
async function UserDataFetcher({ robloxId, inventoryData }: UserDataStreamerProps) {
  // For progressive loading, we'll fetch the main user's data server-side
  // and let the client handle the rest progressively
  
  // Get the main user's data
  const mainUserData = await fetchRobloxUsersBatch([robloxId]).catch(error => {
    console.error('Failed to fetch main user data:', error);
    return {};
  });
  
  const mainUserAvatar = await fetchRobloxAvatars([robloxId]).catch(error => {
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
        // Only add completed avatars to the data
        robloxAvatars[avatarData.targetId.toString()] = avatarData.imageUrl;
      }
      // For blocked avatars, don't add them to the data so components can use their own fallback
    });
  }

  return (
    <InventoryCheckerClient 
      initialData={inventoryData} 
      robloxId={robloxId} 
      robloxUsers={robloxUsers} 
      robloxAvatars={robloxAvatars}
    />
  );
}

export default function UserDataStreamer({ robloxId, inventoryData }: UserDataStreamerProps) {
  return (
    <Suspense fallback={<UserDataLoadingFallback robloxId={robloxId} inventoryData={inventoryData} />}>
      <UserDataFetcher robloxId={robloxId} inventoryData={inventoryData} />
    </Suspense>
  );
}
