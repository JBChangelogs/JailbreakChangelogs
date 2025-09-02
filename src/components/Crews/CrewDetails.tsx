'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { CrewLeaderboardEntry as CrewLeaderboardEntryType } from '@/utils/api';
import { RobloxUser } from '@/types';
import { fetchMissingRobloxData } from '@/app/inventories/actions';
import localFont from 'next/font/local';
import { Inter } from 'next/font/google';
import Link from 'next/link';

const bangers = localFont({
  src: '../../../public/fonts/Bangers.ttf',
});

const inter = Inter({ subsets: ['latin'] });

interface CrewDetailsProps {
  crew: CrewLeaderboardEntryType;
  rank: number;
  currentSeason: number;
}

export default function CrewDetails({ crew, rank, currentSeason }: CrewDetailsProps) {
  const [robloxUsers, setRobloxUsers] = useState<Record<string, RobloxUser>>({});
  const [robloxAvatars, setRobloxAvatars] = useState<Record<string, string>>({});


  // Load all crew member data
  useEffect(() => {
    const userIdsToLoad = crew.MemberUserIds.map(userId => userId.toString());
    
    // Fetch user data for all crew members
    const fetchAllUserData = async () => {
      try {
        const result = await fetchMissingRobloxData(userIdsToLoad);
        
        // Update state with new user data
        if (result.userData && typeof result.userData === 'object') {
          setRobloxUsers(prev => ({ ...prev, ...result.userData }));
        }
        
        // Update state with new avatar data
        if (result.avatarData && typeof result.avatarData === 'object') {
          setRobloxAvatars(prev => ({ ...prev, ...result.avatarData }));
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };

    fetchAllUserData();
  }, [crew.MemberUserIds]); // Only depend on crew.MemberUserIds, not robloxUsers

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
    const avatarData = robloxAvatars[userId];
    // The processed avatar data is already the imageUrl string
    return avatarData || null;
  };

  // Helper function to format rating
  const formatRating = (rating: number) => {
    return Math.round(rating).toLocaleString();
  };

  // Helper function to calculate win rate
  const getWinRate = (battlesWon: number, battlesPlayed: number) => {
    if (battlesPlayed === 0) return 0;
    return Math.round((battlesWon / battlesPlayed) * 100);
  };

  // Helper function to format last battle date
  const formatLastBattleDate = (utc: number) => {
    try {
      const date = new Date(utc * 1000); // Convert Unix timestamp to milliseconds
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error parsing date:', utc, error);
      return 'Unknown';
    }
  };

  // Helper function to get time since last battle
  const getTimeSinceLastBattle = (utc: number) => {
    const now = Date.now();
    const lastBattle = utc * 1000; // Convert to milliseconds
    const diffMs = now - lastBattle;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else {
      return `${diffMinutes}m ago`;
    }
  };

  const winRate = getWinRate(crew.BattlesWon, crew.BattlesPlayed);
  const lastBattleDate = formatLastBattleDate(crew.LastBattlePlayedUTC);
  const timeSinceLastBattle = getTimeSinceLastBattle(crew.LastBattlePlayedUTC);

  return (
    <div className="space-y-8">
      {/* Historical Season Notice */}
      {currentSeason !== 19 && (
        <div className="p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 text-blue-200">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Historical Data</span>
            </div>
            <Link
              href="/crews"
              className="px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg transition-colors text-sm font-medium inline-block w-fit"
            >
              Go to Current Season
            </Link>
          </div>
          <p className="text-blue-100 text-sm mt-2">
            This is historical data from Season {currentSeason}.
          </p>
        </div>
      )}

      {/* Crew Header with Flag, Rank, and Info */}
      <div className={`rounded-lg p-4 sm:p-6 border ${
        rank === 1 
          ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-400/50' 
          : rank === 2 
          ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-300/50'
          : rank === 3
          ? 'bg-gradient-to-r from-amber-600/20 to-amber-700/20 border-amber-500/50'
          : 'bg-[#212A31] border-[#2E3944]'
      }`}>
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          {/* Crew Flag with Owner Avatar */}
          <div className="relative w-40 h-28 sm:w-48 sm:h-32 rounded overflow-hidden flex-shrink-0">
            <Image
              src="https://assets.jailbreakchangelogs.xyz/assets/images/crews/flags/Flag_3.png"
              alt="Crew flag"
              width={192}
              height={128}
              className="w-full h-full object-cover"
            />
            {(() => {
              const ownerAvatarUrl = getUserAvatar(crew.OwnerUserId.toString());
              return ownerAvatarUrl ? (
                <div className="absolute inset-0 flex items-center justify-start pl-3 sm:pl-4">
                  <Image
                    src={ownerAvatarUrl}
                    alt={`${getUserDisplay(crew.OwnerUserId.toString())}'s avatar`}
                    width={48}
                    height={48}
                    className="rounded-full shadow-lg sm:w-16 sm:h-16"
                  />
                </div>
              ) : null;
            })()}
          </div>
          
          {/* Crew Info with Rank */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-4">
              <div className={`text-4xl font-bold ${inter.className} ${
                rank === 1 
                  ? 'text-yellow-400' 
                  : rank === 2 
                  ? 'text-gray-300'
                  : rank === 3
                  ? 'text-amber-500'
                  : 'text-blue-300'
              }`}>
                #{rank}
              </div>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className={`${bangers.className} text-2xl sm:text-3xl lg:text-4xl xl:text-5xl text-white break-words`}>
                {getUsername(crew.OwnerUserId.toString())}&apos;s {crew.ClanName}
              </h2>
              <span className="text-[10px] uppercase font-semibold text-white bg-[#5865F2] px-1.5 py-0.5 rounded">New</span>
            </div>
            {currentSeason !== 19 && (
              <p className="text-gray-400 text-sm">
                Season {currentSeason} • Historical Data
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Modern Crew Stats */}
      <div className="bg-gradient-to-br from-[#212A31] to-[#1A2328] rounded-xl p-6 border border-[#2E3944] shadow-lg">
        <h3 className="text-lg font-semibold text-gray-300 mb-6 flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
          Crew Performance
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Rating with gradient background and flag */}
          <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-4 border border-blue-500/30">
            {/* Flag background */}
            <div className="absolute inset-0 opacity-5">
              <Image
                src="https://assets.jailbreakchangelogs.xyz/assets/images/crews/flags/Flag_3.png"
                alt="Crew flag background"
                fill
                className="object-cover"
              />
            </div>

            <div className="relative z-10">
              <div className="text-2xl font-bold text-white mb-1">{formatRating(crew.Rating)}</div>
              <div className="text-blue-300 text-sm font-medium">Rating</div>
            </div>
          </div>

          {/* Battles with animated background and flag */}
          <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-4 border border-green-500/30">
            {/* Flag background */}
            <div className="absolute inset-0 opacity-5">
              <Image
                src="https://assets.jailbreakchangelogs.xyz/assets/images/crews/flags/Flag_3.png"
                alt="Crew flag background"
                fill
                className="object-cover"
              />
            </div>

            <div className="relative z-10">
              <div className="text-2xl font-bold text-white mb-1">{crew.BattlesPlayed}</div>
              <div className="text-green-300 text-sm font-medium">Battles Played</div>
            </div>
          </div>

          {/* Win Rate with progress bar and flag */}
          <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20 p-4 border border-yellow-500/30">
            {/* Flag background */}
            <div className="absolute inset-0 opacity-5">
              <Image
                src="https://assets.jailbreakchangelogs.xyz/assets/images/crews/flags/Flag_3.png"
                alt="Crew flag background"
                fill
                className="object-cover"
              />
            </div>

            <div className="relative z-10">
              <div className="text-2xl font-bold text-white mb-1">{winRate}%</div>
              <div className="text-yellow-300 text-sm font-medium">Win Rate</div>
              <div className="mt-2 bg-white/20 rounded-full h-1.5">
                <div 
                  className="bg-gradient-to-r from-yellow-400 to-orange-400 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${winRate}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Members with icon and flag */}
          <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-4 border border-purple-500/30">
            {/* Flag background */}
            <div className="absolute inset-0 opacity-5">
              <Image
                src="https://assets.jailbreakchangelogs.xyz/assets/images/crews/flags/Flag_3.png"
                alt="Crew flag background"
                fill
                className="object-cover"
              />
            </div>

            <div className="relative z-10">
              <div className="text-2xl font-bold text-white mb-1">{crew.MemberUserIds.length}</div>
              <div className="text-purple-300 text-sm font-medium">Members</div>
            </div>
          </div>

          {/* Last Battle Date with flag */}
          <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-indigo-500/20 to-blue-500/20 p-4 border border-indigo-500/30">
            {/* Flag background */}
            <div className="absolute inset-0 opacity-5">
              <Image
                src="https://assets.jailbreakchangelogs.xyz/assets/images/crews/flags/Flag_3.png"
                alt="Crew flag background"
                fill
                className="object-cover"
              />
            </div>

            <div className="relative z-10">
              <div className="text-lg font-bold text-white mb-1">{lastBattleDate}</div>
              <div className="text-indigo-300 text-sm font-medium">Last Battle</div>
              <div className="text-indigo-200 text-xs mt-1">{timeSinceLastBattle}</div>
            </div>
          </div>

          {/* Battle Stats Summary with flag */}
          <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-red-500/20 to-pink-500/20 p-4 border border-red-500/30">
            {/* Flag background */}
            <div className="absolute inset-0 opacity-5">
              <Image
                src="https://assets.jailbreakchangelogs.xyz/assets/images/crews/flags/Flag_3.png"
                alt="Crew flag background"
                fill
                className="object-cover"
              />
            </div>

            <div className="relative z-10">
              <div className="text-lg font-bold text-white mb-1">{crew.BattlesWon}</div>
              <div className="text-red-300 text-sm font-medium">Battles Won</div>
              <div className="text-red-200 text-xs mt-1">of {crew.BattlesPlayed} total</div>
            </div>
          </div>
        </div>

        {/* Additional Stats Row */}
        <div className="mt-6 pt-6 border-t border-[#37424D]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-[#2E3944] rounded-lg border border-[#37424D]">
              <span className="text-gray-200 text-sm">Win/Loss Ratio</span>
              <span className="text-white font-semibold">
                {crew.BattlesPlayed > 0 
                  ? `${crew.BattlesWon}-${crew.BattlesPlayed - crew.BattlesWon}` 
                  : '0-0'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#2E3944] rounded-lg border border-[#37424D]">
              <span className="text-gray-200 text-sm">Avg Rating</span>
              <span className="text-white font-semibold">{formatRating(crew.Rating)}</span>
            </div>
            {/* Only show Activity for current season */}
            {currentSeason === 19 && (
              <div className="flex items-center justify-between p-3 bg-[#2E3944] rounded-lg border border-[#37424D]">
                <span className="text-gray-200 text-sm">Activity</span>
                <span className={`font-semibold ${timeSinceLastBattle.includes('d') && parseInt(timeSinceLastBattle.split('d')[0]) > 14 ? 'text-red-400' : 'text-green-400'}`}>
                  {timeSinceLastBattle.includes('d') && parseInt(timeSinceLastBattle.split('d')[0]) > 14 ? 'Inactive' : 'Active'}
                </span>
              </div>
            )}
        </div>
        </div>
      </div>

      {/* Crew Members */}
      <div className="bg-[#212A31] rounded-lg p-4 sm:p-6 border border-[#2E3944]">
        <h2 className="text-xl font-bold text-gray-100 mb-4">Crew Members ({crew.MemberUserIds.length})</h2>
        <div className="space-y-3">
          {crew.MemberUserIds
            .sort((a, b) => {
              // Put owner first, then sort by member ID
              if (a === crew.OwnerUserId) return -1;
              if (b === crew.OwnerUserId) return 1;
              return a - b;
            })
            .map((memberId, index) => (
            <CrewMember 
              key={memberId} 
              memberId={memberId} 
              index={index}
              getUserDisplay={getUserDisplay}
              getUsername={getUsername}
              getUserAvatar={getUserAvatar}
              isOwner={memberId === crew.OwnerUserId}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface CrewMemberProps {
  memberId: number;
  index: number;
  getUserDisplay: (userId: string) => string;
  getUsername: (userId: string) => string;
  getUserAvatar: (userId: string) => string | null;
  isOwner: boolean;
}

function CrewMember({ 
  memberId, 
  index, 
  getUserDisplay, 
  getUsername, 
  getUserAvatar, 
  isOwner 
}: CrewMemberProps) {
  const memberIdStr = memberId.toString();
  const displayName = getUserDisplay(memberIdStr);
  const username = getUsername(memberIdStr);
  const avatarUrl = getUserAvatar(memberIdStr);

  return (
    <div className="flex items-center gap-2 sm:gap-3 p-3 rounded-lg bg-[#2E3944] border border-[#37424D] hover:bg-[#37424D] transition-colors">
      {/* Member Number */}
      <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#37424D] text-white font-bold text-xs sm:text-sm flex-shrink-0">
        {index + 1}
      </div>

      {/* Member Avatar */}
      {avatarUrl && (
        <Image
          src={avatarUrl}
          alt={`${displayName}'s avatar`}
          width={24}
          height={24}
          className="rounded-full sm:w-8 sm:h-8 flex-shrink-0"
        />
      )}

      {/* Member Info */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
          <a 
            href={`https://www.roblox.com/users/${memberId}/profile`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 font-medium text-sm sm:text-base truncate hover:text-blue-300 transition-colors"
          >
            {displayName}
          </a>
          {username && (
            <span className="text-gray-300 text-xs sm:text-sm truncate">(@{username})</span>
          )}
          {isOwner && (
            <span className="px-2 py-1 bg-[#5865F2] text-white text-xs rounded-full font-medium w-fit">
              Owner
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
