import InventoryCheckerClient from './InventoryCheckerClient';
import Breadcrumb from '@/components/Layout/Breadcrumb';
import { fetchItemCountStats, fetchUserScansLeaderboard, fetchRobloxUsersBatchLeaderboard, fetchRobloxAvatars, UserScan } from '@/utils/api';
import Image from 'next/image';
import CopyButton from './CopyButton';
import { Suspense } from 'react';
import ExperimentalFeatureBanner from '@/components/UI/ExperimentalFeatureBanner';
import ComingSoon from '@/components/UI/ComingSoon';
import { isFeatureEnabled } from '@/utils/featureFlags';
import { MdOutlineSecurity } from "react-icons/md";
import { RiVerifiedBadgeFill } from "react-icons/ri";

// Type definitions for bot data
interface BotUserData {
  id: number;
  name: string;
  displayName: string;
  hasVerifiedBadge: boolean;
}

interface BotAvatarData {
  targetId: number;
  state: string;
  imageUrl?: string;
  version: string;
}

export const dynamic = 'force-dynamic';

export default function InventoriesPage() {
  // Check if Inventory Calculator feature is enabled
  if (!isFeatureEnabled('INVENTORY_CALCULATOR')) {
    return <ComingSoon />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb />
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold">Inventory Calculator</h1>
        <span className="text-[10px] uppercase font-semibold text-amber-200 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 px-1.5 py-0.5 rounded">Beta</span>
      </div>
      
      <ExperimentalFeatureBanner className="mb-6" />
      
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Enter a Roblox ID or username to view their inventory and calculate item values.
      </p>
      
      <InventoryCheckerClient />
      
      <Suspense fallback={<StatsSkeleton />}>
        <StatsSection />
      </Suspense>
      
      <Suspense fallback={<OfficialBotsSkeleton />}>
        <OfficialBotsSection />
      </Suspense>
      
      <Suspense fallback={<LeaderboardSkeleton />}>
        <LeaderboardSection />
      </Suspense>
    </div>
  );
}

// Skeleton loader for stats section
function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div className="bg-[#212A31] rounded-lg p-4 shadow-sm border border-[#2E3944]">
        <div className="h-8 bg-[#37424D] rounded animate-pulse mb-2"></div>
        <div className="h-4 bg-[#37424D] rounded w-24 animate-pulse"></div>
      </div>
      <div className="bg-[#212A31] rounded-lg p-4 shadow-sm border border-[#2E3944]">
        <div className="h-8 bg-[#37424D] rounded animate-pulse mb-2"></div>
        <div className="h-4 bg-[#37424D] rounded w-24 animate-pulse"></div>
      </div>
    </div>
  );
}

// Skeleton loader for official bots section
function OfficialBotsSkeleton() {
  return (
    <div className="mt-8">
      <div className="h-6 bg-[#37424D] rounded w-48 animate-pulse mb-4"></div>
      <div className="bg-[#212A31] rounded-lg p-4 shadow-sm border border-[#2E3944]">
        <div className="h-4 bg-[#37424D] rounded w-80 animate-pulse mb-3"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[#2E3944] border border-[#37424D]">
              <div className="w-8 h-8 bg-[#37424D] rounded-full animate-pulse"></div>
              <div className="w-10 h-10 bg-[#37424D] rounded-full animate-pulse"></div>
              <div className="flex-1">
                <div className="h-4 bg-[#37424D] rounded w-32 animate-pulse mb-1"></div>
                <div className="h-3 bg-[#37424D] rounded w-24 animate-pulse"></div>
              </div>
              <div className="w-16 h-6 bg-[#37424D] rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Skeleton loader for leaderboard section
function LeaderboardSkeleton() {
  return (
    <div className="mt-8">
      <div className="h-6 bg-[#37424D] rounded w-64 animate-pulse mb-4"></div>
      <div className="bg-[#212A31] rounded-lg p-4 shadow-sm border border-[#2E3944]">
        <div className="max-h-[32rem] overflow-y-auto space-y-3 pr-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg bg-[#2E3944] border border-[#37424D]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#37424D] rounded-full animate-pulse"></div>
                <div className="w-10 h-10 bg-[#37424D] rounded-full animate-pulse"></div>
              </div>
              <div className="flex-1">
                <div className="h-4 bg-[#37424D] rounded w-32 animate-pulse mb-1"></div>
                <div className="h-3 bg-[#37424D] rounded w-24 animate-pulse"></div>
              </div>
              <div className="w-16 h-6 bg-[#37424D] rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Component for stats that loads immediately
async function StatsSection() {
  const stats = await fetchItemCountStats();
  
  if (!stats) {
    return null;
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div className="bg-[#212A31] rounded-lg p-4 shadow-sm border border-[#2E3944]">
        <div className="text-2xl font-bold text-blue-400">
          {stats.item_count_str}
        </div>
        <div className="text-sm text-gray-400">
          Items Tracked
        </div>
      </div>
      <div className="bg-[#212A31] rounded-lg p-4 shadow-sm border border-[#2E3944]">
        <div className="text-2xl font-bold text-green-400">
          {stats.user_count_str}
        </div>
        <div className="text-sm text-gray-400">
          Users Scanned
        </div>
      </div>
    </div>
  );
}

// Component for official scan bots section
async function OfficialBotsSection() {
  const botIds = ['9256688389', '9256079769', '9256380025'];
  
  // Fetch bot data from the API
  const [botUserData, botAvatarData] = await Promise.all([
    fetchRobloxUsersBatchLeaderboard(botIds),
    fetchRobloxAvatars(botIds)
  ]);

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4 text-gray-300">Official Scan Bots</h2>
      <div className="bg-[#212A31] rounded-lg p-4 shadow-sm border border-[#2E3944]">
        <div className="mb-3">
          <p className="text-gray-400 text-sm">
            These are our official inventory scanning bots. Only these accounts are authorized to scan inventories on our behalf.
          </p>
        </div>
        <div className="space-y-3">
          {botIds.map((botId, index) => {
            // Get bot user data
            const botUser = botUserData && typeof botUserData === 'object' ? 
              Object.values(botUserData).find((user): user is BotUserData => 
                typeof user === 'object' && user !== null && 'id' in user && user.id?.toString() === botId
              ) : null;
            
            // Get bot avatar data
            const botAvatar = botAvatarData && typeof botAvatarData === 'object' ? 
              Object.values(botAvatarData).find((avatar): avatar is BotAvatarData => 
                typeof avatar === 'object' && avatar !== null && 'targetId' in avatar && avatar.targetId?.toString() === botId
              ) : null;
            
            const displayName = botUser?.displayName || botUser?.name || `Bot ${index + 1}`;
            const username = botUser?.name || botId;
            const avatarUrl = botAvatar?.imageUrl || null;
            
            return (
              <div key={botId} className="flex items-center gap-3 p-3 rounded-lg bg-[#2E3944] border border-[#37424D]">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-green-600 text-white">
                <RiVerifiedBadgeFill className="w-4 h-4" />
              </div>
                
                {/* Bot Avatar */}
                <div className="w-10 h-10 rounded-full overflow-hidden bg-[#37424D] flex-shrink-0">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={`${displayName}'s avatar`}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-6 h-6 bg-[#5865F2] rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {displayName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="text-blue-400 font-medium">{displayName}</div>
                  <div className="text-sm text-gray-400">@{username} • ID: {botId}</div>
                </div>
                <a
                  href={`https://www.roblox.com/users/${botId}/profile`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-300 hover:text-blue-400 text-xs transition-colors"
                >
                  View Profile
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            );
          })}
        </div>
        <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
          <div className="flex items-start gap-2">
            <MdOutlineSecurity className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="text-yellow-300 text-sm">
              <p className="font-medium">Security Notice</p>
              <p className="text-yellow-400/80 mt-1">
                If someone claims to be scanning inventories for JBCL but isn&apos;t one of these official bots, 
                they are impersonating us. Please report such users to prevent scams.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component for leaderboard section
async function LeaderboardSection() {
  const leaderboard = await fetchUserScansLeaderboard();
  
  if (!leaderboard || leaderboard.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4 text-gray-300">Most Scanned Players ({leaderboard.slice(3).length})</h2>
      <div className="bg-[#212A31] rounded-lg p-4 shadow-sm border border-[#2E3944]">
        <div className="max-h-[32rem] overflow-y-auto space-y-3 pr-2">
          {leaderboard.slice(3).map((user, index) => (
            <Suspense key={user.user_id} fallback={<BasicLeaderboardUser user={user} index={index} />}>
              <LeaderboardUser user={user} index={index} />
            </Suspense>
          ))}
        </div>
      </div>
    </div>
  );
}

// Component for individual user with their Roblox data
async function LeaderboardUser({ user, index }: { user: UserScan; index: number }) {
  let robloxUser: { displayName?: string; name?: string } | null = null;
  let avatarUrl: string | null = null;
  
  try {
    // Fetch individual user data
    const [userDataResult, avatarData] = await Promise.all([
      fetchRobloxUsersBatchLeaderboard([user.user_id]),
      fetchRobloxAvatars([user.user_id])
    ]);

    // Process user data
    if (userDataResult && typeof userDataResult === 'object') {
      const userData = Object.values(userDataResult)[0] as { id: number; name: string; displayName: string; hasVerifiedBadge: boolean };
      if (userData && userData.id) {
        robloxUser = userData;
      }
    }

    // Process avatar data
    if (avatarData && typeof avatarData === 'object') {
      const avatar = Object.values(avatarData)[0] as { targetId: number; state: string; imageUrl?: string; version: string };
      if (avatar && avatar.targetId && avatar.state === 'Completed' && avatar.imageUrl) {
        avatarUrl = avatar.imageUrl;
      }
      // For blocked avatars, don't set avatarUrl so the component can use its own fallback
    }
  } catch (error) {
    console.error(`Failed to fetch Roblox data for user ${user.user_id}:`, error);
  }

  const displayName = robloxUser?.displayName || robloxUser?.name || `User ${user.user_id}`;
  const username = robloxUser?.name || user.user_id;
  
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg bg-[#2E3944] border border-[#37424D]">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
          index === 0 ? 'bg-yellow-500 text-black' :
          index === 1 ? 'bg-gray-400 text-black' :
          index === 2 ? 'bg-amber-600 text-white' :
          'bg-[#37424D] text-gray-300'
        }`}>
          {index + 1}
        </div>
        
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full overflow-hidden bg-[#37424D] flex-shrink-0">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={`${displayName}'s avatar`}
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-6 h-6 bg-[#5865F2] rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-blue-400 font-medium break-words">
              {displayName}
            </div>
            <div className="text-sm text-gray-400 break-words">@{username} • {user.upsert_count.toLocaleString()} scans</div>
            <a
              href={`https://www.roblox.com/users/${user.user_id}/profile`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-300 hover:text-blue-400 text-xs mt-1 transition-colors"
            >
              View Roblox Profile
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
          <CopyButton text={user.user_id} className="flex-shrink-0 mt-1" />
        </div>
      </div>
    </div>
  );
}

// Component for basic user (fallback)
function BasicLeaderboardUser({ user, index }: { user: UserScan; index: number }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg bg-[#2E3944] border border-[#37424D]">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
          index === 0 ? 'bg-yellow-500 text-black' :
          index === 1 ? 'bg-gray-400 text-black' :
          index === 2 ? 'bg-amber-600 text-white' :
          'bg-[#37424D] text-gray-300'
        }`}>
          {index + 1}
        </div>
        
        {/* Placeholder Avatar */}
        <div className="w-10 h-10 rounded-full bg-[#37424D] flex-shrink-0 flex items-center justify-center">
          <div className="w-6 h-6 bg-[#5865F2] rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">?</span>
          </div>
        </div>
      </div>
      
             <div className="flex-1 min-w-0">
         <div className="flex items-start gap-2">
           <div className="flex-1 min-w-0">
             <div className="text-blue-400 font-medium">User {user.user_id}</div>
             <div className="text-sm text-gray-400">@{user.user_id} • {user.upsert_count.toLocaleString()} scans</div>
           </div>
           <CopyButton text={user.user_id} className="flex-shrink-0 mt-1" />
         </div>
       </div>
    </div>
  );
}


