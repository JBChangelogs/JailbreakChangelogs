'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CrewLeaderboardEntry as CrewLeaderboardEntryType } from '@/utils/api';
import { RobloxUser } from '@/types';
import { fetchMissingRobloxData } from '@/app/inventories/actions';
import localFont from 'next/font/local';
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useDebounce } from '@/hooks/useDebounce';

const bangers = localFont({
  src: '../../../public/fonts/Bangers.ttf',
});

interface CrewLeaderboardProps {
  leaderboard: CrewLeaderboardEntryType[];
}

export default function CrewLeaderboard({ leaderboard }: CrewLeaderboardProps) {
  const [robloxUsers, setRobloxUsers] = useState<Record<string, RobloxUser>>({});
  const [robloxAvatars, setRobloxAvatars] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Progressive loading of missing user data
  const fetchMissingUserData = useCallback(async (userIds: string[]) => {
    const missingIds = userIds.filter(id => !robloxUsers[id]);
    
    if (missingIds.length === 0) return;
    
    try {
      const result = await fetchMissingRobloxData(missingIds);
      
      // Update state with new user data
      if (result.userData && typeof result.userData === 'object') {
        setRobloxUsers(prev => ({ ...prev, ...result.userData }));
      }
      
      // Update state with new avatar data
      if (result.avatarData && typeof result.avatarData === 'object') {
        setRobloxAvatars(prev => ({ ...prev, ...result.avatarData }));
      }
    } catch (error) {
      console.error('Failed to fetch missing user data:', error);
    }
  }, [robloxUsers]);

  // Load all crew data
  useEffect(() => {
    if (leaderboard.length === 0) return;

    const userIdsToLoad = leaderboard.map(crew => crew.OwnerUserId.toString());
    
    // Fetch user data for all crew owners
    fetchMissingUserData(userIdsToLoad);
  }, [leaderboard, fetchMissingUserData]);

  // Filter crews based on search term
  const filteredLeaderboard = leaderboard.filter(crew => {
    if (!debouncedSearchTerm) return true;
    
    const searchLower = debouncedSearchTerm.toLowerCase();
    const crewName = crew.ClanName.toLowerCase();
    const ownerId = crew.OwnerUserId.toString();
    const owner = robloxUsers[ownerId];
    const ownerName = owner?.displayName?.toLowerCase() || owner?.name?.toLowerCase() || '';
    
    return crewName.includes(searchLower) || ownerName.includes(searchLower);
  });

  // Helper function to get user display name
  const getUserDisplay = (userId: string) => {
    const user = robloxUsers[userId];
    return user?.displayName || user?.name || `User ${userId}`;
  };

  // Helper function to get username
  const getUsername = (userId: string) => {
    const user = robloxUsers[userId];
    return user?.name || userId;
  };

  // Helper function to get user avatar
  const getUserAvatar = (userId: string) => {
    return robloxAvatars[userId] || null;
  };

  // Helper function to format rating
  const formatRating = (rating: number) => {
    return Math.round(rating).toLocaleString();
  };

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4 text-gray-300">Crew Leaderboard</h2>
        <div className="bg-[#212A31] rounded-lg p-4 shadow-sm border border-[#2E3944]">
          <p className="text-gray-400 text-center py-8">No crew data available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4 text-gray-300">Crew Leaderboard ({filteredLeaderboard.length})</h2>
      
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search crews..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-[#2E3944] bg-[#37424D] px-4 py-2 pl-10 pr-10 text-white placeholder-[#D3D9D4] focus:border-[#124E66] focus:outline-none"
          />
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#FFFFFF]" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#FFFFFF] hover:text-gray-300"
              aria-label="Clear search"
            >
              <XMarkIcon />
            </button>
          )}
        </div>
      </div>

      <div className="bg-[#212A31] rounded-lg p-4 shadow-sm border border-[#2E3944]">
        <div className="max-h-[48rem] overflow-y-auto space-y-3 pr-2">
          {filteredLeaderboard.map((crew) => {
            // Find the original rank of this crew in the full leaderboard
            const originalIndex = leaderboard.findIndex(c => c.ClanId === crew.ClanId);
            return (
              <CrewLeaderboardEntry 
                key={crew.ClanId} 
                crew={crew} 
                index={originalIndex}
                getUserDisplay={getUserDisplay}
                getUsername={getUsername}
                getUserAvatar={getUserAvatar}
                formatRating={formatRating}
              />
            );
          })}
          
          {filteredLeaderboard.length === 0 && searchTerm && (
            <div className="text-center py-8">
              <p className="text-gray-400">No crews found matching &quot;{searchTerm}&quot;</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface CrewLeaderboardEntryProps {
  crew: CrewLeaderboardEntryType;
  index: number;
  getUserDisplay: (userId: string) => string;
  getUsername: (userId: string) => string;
  getUserAvatar: (userId: string) => string | null;
  formatRating: (rating: number) => string;
}

function CrewLeaderboardEntry({ 
  crew, 
  index, 
  getUserDisplay, 
  getUsername, 
  getUserAvatar, 
  formatRating
}: CrewLeaderboardEntryProps) {
  const ownerId = crew.OwnerUserId.toString();
  const displayName = getUserDisplay(ownerId);
  const username = getUsername(ownerId);
  const avatarUrl = getUserAvatar(ownerId);

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-3 p-6 rounded-lg border transition-colors ${
      index === 0 
        ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-400/50 hover:bg-gradient-to-r hover:from-yellow-500/30 hover:to-yellow-600/30' 
        : index === 1 
        ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-300/50 hover:bg-gradient-to-r hover:from-gray-400/30 hover:to-gray-500/30'
        : index === 2
        ? 'bg-gradient-to-r from-amber-600/20 to-amber-700/20 border-amber-500/50 hover:bg-gradient-to-r hover:from-amber-600/30 hover:to-amber-700/30'
        : 'bg-[#2E3944] border-[#37424D] hover:bg-[#37424D]'
    }`}>
      {/* Rank Badge */}
      <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-base ${
        index === 0 
          ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-800' 
          : index === 1 
          ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800'
          : index === 2
          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-gray-800'
          : 'bg-[#5865F2] text-white'
      }`}>
        {index + 1}
      </div>

      {/* Crew Flag with Owner Avatar */}
      <div className="relative w-32 h-20 rounded overflow-hidden">
        <Image
          src="https://assets.jailbreakchangelogs.xyz/assets/images/crews/flags/Flag_3.png"
          alt="Crew flag"
          width={128}
          height={80}
          className="w-full h-full object-cover"
        />
        {avatarUrl && (
          <div className="absolute inset-0 flex items-center justify-start pl-2">
            <Image
              src={avatarUrl}
              alt={`${displayName}'s avatar`}
              width={56}
              height={56}
              className="rounded-full"
            />
          </div>
        )}
      </div>

      {/* Crew Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className={`text-lg sm:text-xl md:text-2xl lg:text-3xl text-white break-words ${bangers.className}`}>
            <a 
              href={`https://www.roblox.com/users/${crew.OwnerUserId}/profile`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-300 hover:text-blue-200 transition-colors"
            >
              {username}
            </a>&apos;s {crew.ClanName}
          </h3>
        </div>
      </div>

      {/* Stats and View Crew Button */}
      <div className="flex items-center justify-between gap-6">
        {/* Stats */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-lg font-semibold text-white">{formatRating(crew.Rating)}</div>
            <div className="text-xs text-gray-400">Rating</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-white">{crew.BattlesPlayed}</div>
            <div className="text-xs text-gray-400">Battles</div>
          </div>
        </div>
        
        {/* View Crew Button - positioned on the right side */}
        <Link
          href={`/crews/${index + 1}`}
          className="px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg transition-colors text-sm font-medium inline-block"
        >
          View Crew
        </Link>
      </div>
    </div>
  );
}
