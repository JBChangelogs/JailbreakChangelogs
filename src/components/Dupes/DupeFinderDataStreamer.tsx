import { Suspense } from 'react';
import { fetchDupeFinderData, fetchRobloxUserByUsername, fetchRobloxUsersBatch, fetchRobloxAvatars } from '@/utils/api';
import DupeFinderClient from './DupeFinderClient';
import type { RobloxUser } from '@/types';

interface DupeFinderDataStreamerProps {
  robloxId: string;
}

// Loading fallback component
function DupeFinderLoadingFallback() {
  return (
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
  );
}

// Component that fetches dupe finder data
async function DupeFinderDataFetcher({ robloxId }: { robloxId: string }) {
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
          <DupeFinderClient 
            robloxId={robloxId} 
            error={`Username "${robloxId}" not found. Please check the spelling and try again.`} 
          />
        );
      }
    } catch (error) {
      console.error('Error fetching user by username:', error);
      return (
        <DupeFinderClient 
          robloxId={robloxId} 
          error={`Failed to find user "${robloxId}". Please check the spelling and try again.`} 
        />
      );
    }
  }

  const result = await fetchDupeFinderData(actualRobloxId);

  // Check if the result contains an error
  if (result && 'error' in result) {
    return (
      <DupeFinderClient 
        robloxId={actualRobloxId} 
        error={result.error}
      />
    );
  }

  // Check if no data was returned
  if (!result || !Array.isArray(result)) {
    return (
      <DupeFinderClient 
        robloxId={actualRobloxId} 
        error="No dupe data found for this user." 
      />
    );
  }

  // Get the main user's data (the one being searched)
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
        // Only add completed avatars to the data
        robloxAvatars[avatarData.targetId.toString()] = avatarData.imageUrl;
      }
      // For blocked avatars, don't add them to the data so components can use their own fallback
    });
  }

  return (
    <Suspense fallback={<DupeFinderClient robloxId={actualRobloxId} initialData={result} isLoading={true} />}>
      <DupeFinderClient 
        robloxId={actualRobloxId} 
        initialData={result}
        robloxUsers={robloxUsers}
        robloxAvatars={robloxAvatars}
      />
    </Suspense>
  );
}

export default function DupeFinderDataStreamer({ robloxId }: DupeFinderDataStreamerProps) {
  return (
    <Suspense fallback={<DupeFinderLoadingFallback />}>
      <DupeFinderDataFetcher robloxId={robloxId} />
    </Suspense>
  );
}
