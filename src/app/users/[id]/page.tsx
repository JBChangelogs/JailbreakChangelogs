'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Error from 'next/error';
import { UserAvatar } from '@/utils/avatar';
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { fetchUserById } from '@/utils/api';
import { Button, Skeleton } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import UserPlusIcon from '@heroicons/react/24/outline/UserPlusIcon';
import { Banner } from '@/components/Profile/Banner';
import { UserSettings, FollowingData, FollowerData } from '@/types/auth';
import { toast } from 'react-hot-toast';
import { Tooltip } from '@mui/material';
import { getToken } from '@/utils/auth';
import { PROD_API_URL } from '@/services/api';
import { UserBadges } from '@/components/Profile/UserBadges';
import { formatRelativeDate, formatShortDate, formatCustomDate } from '@/utils/timestamp';
import ProfileTabs from '@/components/Profile/ProfileTabs';
import { DiscordIcon } from '@/components/Icons/DiscordIcon';
import { RobloxIcon } from '@/components/Icons/RobloxIcon';
import FollowersModal from '@/components/Users/FollowersModal';
import FollowingModal from '@/components/Users/FollowingModal';
import type { UserFlag } from '@/types/auth';

interface CommentData {
  id: number;
  author: string;
  content: string;
  date: string;
  item_id: number;
  item_type: string;
  user_id: string;
  edited_at: number | null;
  owner: string;
}

interface User {
  id: string;
  username: string;
  avatar: string;
  global_name: string;
  usernumber: number;
  accent_color: string;
  custom_avatar?: string;
  banner?: string;
  custom_banner?: string;
  settings?: UserSettings;
  presence?: {
    status: "Online" | "Offline";
    last_updated: number;
  };
  premiumtype?: number;
  is_following?: boolean;
  followers_count?: number;
  following_count?: number;
  created_at?: string;
  last_seen?: number | null;
  bio?: string;
  bio_last_updated?: number;
  roblox_id: string | null;
  roblox_username?: string;
  flags?: UserFlag[];
}

interface Server {
  id: number;
  link: string;
  owner: string;
  rules: string;
  expires: string;
  created_at: string;
}

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoadingFollow, setIsLoadingFollow] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isAuthenticatedUser, setIsAuthenticatedUser] = useState(false);
  const [bio, setBio] = useState<string | null>(null);
  const [bioLastUpdated, setBioLastUpdated] = useState<number | null>(null);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);
  const [isFollowingModalOpen, setIsFollowingModalOpen] = useState(false);
  const [privateServers, setPrivateServers] = useState<Server[]>([]);

  const refreshBio = async (newBio: string) => {
    setBio(newBio);
    setBioLastUpdated(Date.now());
  };

  useEffect(() => {
    const checkAuthStatus = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setCurrentUserId(userData.id);
          setIsAuthenticatedUser(true);
        } catch (error) {
          console.error('Error parsing user data:', error);
          setCurrentUserId(null);
          setIsAuthenticatedUser(false);
        }
      } else {
        setCurrentUserId(null);
        setIsAuthenticatedUser(false);
      }
    };

    checkAuthStatus();

    window.addEventListener('storage', checkAuthStatus);
    
    const handleAuthChange = () => checkAuthStatus();
    window.addEventListener('authStateChanged', handleAuthChange);

    return () => {
      window.removeEventListener('storage', checkAuthStatus);
      window.removeEventListener('authStateChanged', handleAuthChange);
    };
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        const userData = await fetchUserById(userId);
        
        if (userData) {
          setUser(userData);
          
          const fetchPromises = [];
          
          if (currentUserId) {
            fetchPromises.push(
              fetch(`${PROD_API_URL}/users/following/get?user=${currentUserId}`)
                .then(res => res.json())
                .then((followingData: FollowingData[] | string) => {
                  const isUserFollowing = Array.isArray(followingData) && followingData.some(followedUser => 
                    followedUser.user_id === currentUserId && followedUser.following_id === userId
                  );
                  setIsFollowing(isUserFollowing);
                })
                .catch((error: Error) => console.error('Error fetching following status:', error))
            );
          }
          
          fetchPromises.push(
            fetch(`${PROD_API_URL}/users/followers/get?user=${userId}`)
              .then(res => res.json())
              .then((followersData: FollowerData[] | string) => {
                setFollowerCount(Array.isArray(followersData) ? followersData.length : 0);
              })
              .catch((error: Error) => console.error('Error fetching followers:', error))
          );
          
          fetchPromises.push(
            fetch(`${PROD_API_URL}/users/following/get?user=${userId}`)
              .then(res => res.json())
              .then((followingData: FollowingData[] | string) => {
                setFollowingCount(Array.isArray(followingData) ? followingData.length : 0);
              })
              .catch((error: Error) => console.error('Error fetching following:', error))
          );
          
          fetchPromises.push(
            fetch(`${PROD_API_URL}/users/description/get?user=${userId}&nocache=true`)
              .then(res => res.json())
              .then((bioData) => {
                if (bioData) {
                  setBio(bioData.description || null);
                  setBioLastUpdated(bioData.last_updated || null);
                }
              })
              .catch((error: Error) => console.error('Error fetching user bio:', error))
          );

          fetchPromises.push(
            fetch(`${PROD_API_URL}/users/comments/get?author=${userId}`)
              .then(res => res.json())
              .then((commentsData) => {
                setComments(Array.isArray(commentsData) ? commentsData : []);
              })
              .catch((error) => {
                console.error('Error fetching comments:', error);
                setCommentsError('Failed to fetch comments');
              })
              .finally(() => {
                setCommentsLoading(false);
              })
          );
          
          // Fetch private servers for this user
          fetchPromises.push(
            fetch(`${PROD_API_URL}/servers/get?owner=${userId}`)
              .then(res => {
                if (!res.ok) throw null;
                return res.json();
              })
              .then((data: Server[]) => {
                setPrivateServers(Array.isArray(data) ? data : []);
              })
              .catch(() => {
                setPrivateServers([]);
              })
          );
          
          await Promise.all(fetchPromises);
        } else {
          setError('User not found');
          setErrorCode(404);
        }
      } catch (error: unknown) {
        console.error('Error fetching user:', error);
        
        // Check if this is a banned user error
        if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message.startsWith('BANNED_USER:')) {
          const bannedMessage = error.message.replace('BANNED_USER:', '').trim();
          setError(bannedMessage);
          setErrorCode(403);
        } else {
          setError('Failed to load user data');
          setErrorCode(500);
        }
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadUser();
    }
  }, [userId, currentUserId]);

  const handleFollow = async () => {
    if (isLoadingFollow) return;
    
    setIsLoadingFollow(true);
    try {
      const token = getToken();

      if (!token) {
        toast.error('You need to be logged in to follow users');
        setIsLoadingFollow(false);
        return;
      }

      let response;
      
      if (isFollowing) {
        response = await fetch(`${PROD_API_URL}/users/followers/remove`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ follower: token, following: userId })
        });
      } else {
        response = await fetch(`${PROD_API_URL}/users/followers/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ follower: token, following: userId })
        });
      }

      if (!response.ok) {
        const errorMessage = isFollowing ? 'Failed to unfollow user' : 'Failed to follow user';
        toast.error(errorMessage);
        return;
      }

      setIsFollowing(!isFollowing);
      
      if (isFollowing) {
        setFollowerCount(prevCount => Math.max(0, prevCount - 1));
      } else {
        setFollowerCount(prevCount => prevCount + 1);
      }
      
      if (user) {
        setUser({ ...user, is_following: !isFollowing });
      }
      
      toast.success(isFollowing ? 'Successfully unfollowed user' : 'Successfully followed user');
    } catch (error) {
      console.error('Error updating follow status:', error);
      toast.error(isFollowing ? 'Failed to unfollow user' : 'Failed to follow user');
    } finally {
      setIsLoadingFollow(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#2E3944]">
        <div className="container mx-auto max-w-7xl mb-8">
          <Breadcrumb loading={true} />
          <div className="bg-[#212A31] rounded-lg shadow-md border border-[#2E3944] overflow-hidden">
            {/* Banner skeleton */}
            <Skeleton variant="rectangular" height={256} sx={{ bgcolor: '#2E3944' }} />
            
            {/* Profile Content skeleton */}
            <div className="p-3 sm:p-4 md:p-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-3 md:gap-6">
                {/* Avatar skeleton */}
                <div className="relative -mt-16 md:-mt-24">
                  <Skeleton variant="circular" width={96} height={96} sx={{ bgcolor: '#2E3944' }} />
                </div>
                
                <div className="flex-1 w-full text-center md:text-left">
                  <div className="flex flex-col md:flex-row justify-between items-center md:items-start">
                    <div>
                      {/* Username skeleton */}
                      <Skeleton variant="text" width={160} height={28} sx={{ bgcolor: '#2E3944' }} />
                      {/* Handle skeleton */}
                      <Skeleton variant="text" width={128} height={16} sx={{ bgcolor: '#2E3944' }} />
                      {/* Last seen skeleton */}
                      <Skeleton variant="text" width={192} height={12} sx={{ bgcolor: '#2E3944' }} />
                      {/* Member since skeleton */}
                      <Skeleton variant="text" width={224} height={12} sx={{ bgcolor: '#2E3944' }} />
                      
                      {/* Follower/Following skeleton */}
                      <div className="flex items-center justify-center md:justify-start space-x-4 mt-2">
                        <Skeleton variant="text" width={80} height={16} sx={{ bgcolor: '#2E3944' }} />
                        <Skeleton variant="text" width={80} height={16} sx={{ bgcolor: '#2E3944' }} />
                      </div>
                      
                      {/* Connection icons skeleton */}
                      <div className="flex items-center justify-center md:justify-start space-x-3 mt-2">
                        <Skeleton variant="circular" width={20} height={20} sx={{ bgcolor: '#2E3944' }} />
                        <Skeleton variant="circular" width={20} height={20} sx={{ bgcolor: '#2E3944' }} />
                      </div>
                    </div>
                    
                    {/* Button skeleton */}
                    <Skeleton variant="rounded" width={112} height={40} sx={{ bgcolor: '#2E3944' }} />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Tabs skeleton */}
            <div className="mt-2 md:mt-6">
              <div className="border-b border-[#2E3944]">
                <div className="flex p-2 gap-4 overflow-x-auto">
                  <Skeleton variant="rounded" width={80} height={32} sx={{ bgcolor: '#2E3944' }} />
                  <Skeleton variant="rounded" width={80} height={32} sx={{ bgcolor: '#2E3944' }} />
                  <Skeleton variant="rounded" width={80} height={32} sx={{ bgcolor: '#2E3944' }} />
                  <Skeleton variant="rounded" width={80} height={32} sx={{ bgcolor: '#2E3944' }} />
                </div>
              </div>
              <div className="p-3 sm:p-4">
                {/* Tab content skeleton */}
                <div className="space-y-4">
                  <Skeleton variant="rounded" height={80} sx={{ bgcolor: '#2E3944' }} />
                  <Skeleton variant="rounded" height={80} sx={{ bgcolor: '#2E3944' }} />
                  <Skeleton variant="rounded" height={80} sx={{ bgcolor: '#2E3944' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (errorCode) {
    // Special handling for banned users
    if (errorCode === 403) {
      return (
        <main className="min-h-screen bg-[#2E3944] pb-8">
          <div className="container mx-auto">
            <Breadcrumb />
            <div className="bg-[#212A31] rounded-lg shadow-md border border-[#2E3944] overflow-hidden">
              <div className="p-8">
                <div className="flex flex-col items-center justify-center space-y-6">
                  <div className="w-full max-w-md bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
                    <div className="flex items-center justify-center space-x-3 mb-4">
                      <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <h2 className="text-lg font-semibold text-red-500">User Banned</h2>
                    </div>
                    <p className="text-[#FFFFFF]">{error}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      );
    }
    
    return <Error statusCode={errorCode} title={error || undefined} />;
  }

  if (!user) {
    return <Error statusCode={404} title="User not found" />;
  }

  if (user.settings?.profile_public === 0 && currentUserId !== user.id) {
    return (
      <main className="min-h-screen bg-[#2E3944] pb-8">
        <div className="container mx-auto">
          <Breadcrumb userData={user} />
          <div className="bg-[#212A31] rounded-lg shadow-md border border-[#2E3944] overflow-hidden">
            <div className="p-8">
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="relative mt-4">
                  <UserAvatar
                    userId={user.id}
                    avatarHash={user.avatar}
                    username={user.username}
                    size={24}
                    accent_color={user.accent_color}
                    custom_avatar={user.custom_avatar}
                    showBadge={false}
                    settings={user.settings}
                    premiumType={user.premiumtype}
                  />
                </div>
                <div className="text-center space-y-2">
                  <div className="flex flex-wrap justify-center items-center gap-2">
                    <h1 className="text-xl md:text-2xl font-bold text-muted">
                      {user.global_name && user.global_name !== "None" ? user.global_name : user.username}
                    </h1>
                    <UserBadges usernumber={user.usernumber} premiumType={user.premiumtype} flags={user.flags} size="lg" />
                  </div>
                  <p className="text-[#FFFFFF]">@{user.username}</p>
                </div>
                <div className="w-full max-w-md bg-[#2E3944] rounded-lg p-6 text-center">
                  <div className="flex items-center justify-center space-x-3 mb-4">
                    <svg className="w-6 h-6 text-[#FFFFFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <h2 className="text-lg font-semibold text-muted">Private Profile</h2>
                  </div>
                  <p className="text-[#FFFFFF]">This user has chosen to keep their profile private</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#2E3944] pb-8">
      <div className="container mx-auto max-w-7xl">
        <Breadcrumb userData={user} />
        <div className="bg-[#212A31] rounded-lg shadow-md border border-[#2E3944] overflow-hidden">
          {/* Banner Section */}
          <Banner
            userId={user.id}
            username={user.username}
            banner={user.banner}
            customBanner={user.custom_banner}
            settings={user.settings}
          />
          
          {/* Profile Content */}
          <div className="p-3 sm:p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-3 md:gap-6">
              {/* Avatar - smaller on mobile */}
              <div className="relative -mt-10 md:-mt-18">
                {loading ? (
                  <Skeleton variant="circular" width={96} height={96} sx={{ bgcolor: '#2E3944' }} />
                ) : (
                  <UserAvatar
                    userId={user.id}
                    avatarHash={user.avatar}
                    username={user.username}
                    size={24}
                    accent_color={user.accent_color}
                    custom_avatar={user.custom_avatar}
                    isOnline={user.settings?.hide_presence === 1 ? false : user.presence?.status === "Online"}
                    showBadge={true}
                    settings={user.settings}
                    premiumType={user.premiumtype}
                  />
                )}
              </div>
              <div className="flex-1 w-full">
                <div className="flex flex-col md:flex-row justify-between">
                  <div className="text-center md:text-left w-full md:w-auto">
                    <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 max-w-full">
                      {loading ? (
                        <>
                          <Skeleton variant="text" width={160} height={28} sx={{ bgcolor: '#2E3944' }} />
                          <Skeleton variant="text" width={80} height={24} sx={{ bgcolor: '#2E3944' }} />
                        </>
                      ) : (
                        <>
                          <h1 className="text-2xl md:text-3xl font-bold text-muted mb-1 max-w-[280px] lg:max-w-none truncate">
                            {user.global_name && user.global_name !== "None" ? user.global_name : user.username}
                          </h1>
                          <UserBadges usernumber={user.usernumber} premiumType={user.premiumtype} flags={user.flags} size="lg" />
                        </>
                      )}
                    </div>
                    {loading ? (
                      <Skeleton variant="text" width={128} height={16} sx={{ bgcolor: '#2E3944' }} />
                    ) : (
                      <p className="text-[#D3D9D4] text-lg mb-1 max-w-[280px] lg:max-w-none truncate mx-auto md:mx-0">@{user.username}</p>
                    )}
                    
                    {loading ? (
                      <Skeleton variant="text" width={192} height={12} sx={{ bgcolor: '#2E3944' }} />
                    ) : (
                      <>
                        {user.settings?.hide_presence === 1 ? (
                          <p className="text-[#D3D9D4] text-sm">Last seen: Hidden</p>
                        ) : user.presence?.status === "Online" ? (
                          <p className="text-[#44b700] text-sm">Online</p>
                        ) : user.last_seen === null ? (
                          <div className="bg-[#2E3944] rounded-lg p-4 mt-2 mb-2">
                            <p className="text-muted text-sm font-medium mb-1">Are you the owner of this profile?</p>
                            <p className="text-[#FFFFFF] text-sm">Login to enable status indicators and last seen timestamps. Your Discord avatar, banner, and username changes will automatically sync with your profile.</p>
                          </div>
                        ) : user.last_seen && (
                          <Tooltip 
                            title={formatCustomDate(user.last_seen)}
                            placement="top"
                            arrow
                            slotProps={{
                              tooltip: {
                                sx: {
                                  backgroundColor: '#0F1419',
                                  color: '#D3D9D4',
                                  fontSize: '0.75rem',
                                  padding: '8px 12px',
                                  borderRadius: '8px',
                                  border: '1px solid #2E3944',
                                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                                  '& .MuiTooltip-arrow': {
                                    color: '#0F1419',
                                  }
                                }
                              }
                            }}
                          >
                            <p className="text-[#D3D9D4] text-sm cursor-help">Last seen: {formatRelativeDate(user.last_seen)}</p>
                          </Tooltip>
                        )}
                      </>
                    )}
                    
                    {loading ? (
                      <Skeleton variant="text" width={224} height={12} sx={{ bgcolor: '#2E3944' }} />
                    ) : (
                      user.created_at && (
                        <p className="text-[#D3D9D4] text-base mb-1">
                          Member #{user.usernumber} since{' '}
                          <Tooltip 
                            title={formatCustomDate(parseInt(user.created_at) * 1000)}
                            placement="top"
                            arrow
                            slotProps={{
                              tooltip: {
                                sx: {
                                  backgroundColor: '#0F1419',
                                  color: '#D3D9D4',
                                  fontSize: '0.75rem',
                                  padding: '8px 12px',
                                  borderRadius: '8px',
                                  border: '1px solid #2E3944',
                                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                                  '& .MuiTooltip-arrow': {
                                    color: '#0F1419',
                                  }
                                }
                              }
                            }}
                          >
                            <span className="cursor-help">{formatShortDate(user.created_at)}</span>
                          </Tooltip>
                        </p>
                      )
                    )}
                    
                    {/* Follower/Following Counts */}
                    <div className="flex items-center justify-center md:justify-start space-x-4 mt-2">
                      <button
                        onClick={() => followerCount > 0 && setIsFollowersModalOpen(true)}
                        className={`text-muted text-base ${followerCount > 0 ? 'hover:text-[#5865F2] transition-colors' : 'cursor-default'}`}
                      >
                        <span className="font-semibold">{followerCount}</span> {followerCount === 1 ? 'follower' : 'followers'}
                      </button>
                      <button
                        onClick={() => followingCount > 0 && setIsFollowingModalOpen(true)}
                        className={`text-muted text-base ${followingCount > 0 ? 'hover:text-[#5865F2] transition-colors' : 'cursor-default'}`}
                      >
                        <span className="font-semibold">{followingCount}</span> following
                      </button>
                    </div>
                    
                    {/* Connection Icons */}
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2 mb-5 md:mb-0">
                      {loading ? (
                        <>
                          <Skeleton variant="circular" width={20} height={20} sx={{ bgcolor: '#2E3944' }} />
                          <Skeleton variant="circular" width={20} height={20} sx={{ bgcolor: '#2E3944' }} />
                        </>
                      ) : (
                        <>
                          <Tooltip title="Visit Discord Profile">
                            <Link
                              href={`https://discord.com/users/${user.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#5865F2]/10 border border-[#5865F2]/20 text-[#5865F2] hover:bg-[#5865F2]/20 transition-colors max-w-[320px] sm:max-w-none"
                            >
                              <DiscordIcon className="h-5 w-5 flex-shrink-0" />
                              <span className="text-sm font-medium truncate">{user.username}</span>
                            </Link>
                          </Tooltip>
                          
                          {user.roblox_id && (
                            <Tooltip title="Visit Roblox Profile">
                              <Link
                                href={`https://www.roblox.com/users/${user.roblox_id}/profile`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2E3944] border border-[#37424D] text-muted hover:bg-[#37424D] transition-colors max-w-[320px] sm:max-w-none"
                              >
                                <RobloxIcon className="h-5 w-5 flex-shrink-0" />
                                <span className="text-sm font-medium truncate">{user.roblox_username}</span>
                              </Link>
                            </Tooltip>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="md:self-start flex justify-center mt-1 md:mt-0">
                    {loading ? (
                      <Skeleton variant="rounded" width={112} height={40} sx={{ bgcolor: '#2E3944' }} />
                    ) : (
                      <>
                        {currentUserId === user.id ? (
                          <Link href="/settings">
                            <Button
                              variant="outlined"
                              startIcon={<SettingsIcon />}
                              sx={{
                                borderColor: '#5865F2',
                                color: '#5865F2',
                                '&:hover': {
                                  borderColor: '#4752C4',
                                  backgroundColor: 'rgba(88, 101, 242, 0.1)',
                                },
                              }}
                            >
                              Settings
                            </Button>
                          </Link>
                        ) : isAuthenticatedUser && currentUserId ? (
                          <Tooltip title={isFollowing ? 'Unfollow this user' : 'Follow this user'}>
                            <span>
                              <Button
                                variant={isFollowing ? "outlined" : "contained"}
                                startIcon={<UserPlusIcon className="h-5 w-5" />}
                                onClick={handleFollow}
                                disabled={isLoadingFollow}
                                sx={{
                                  backgroundColor: isFollowing ? 'transparent' : '#5865F2',
                                  color: isFollowing ? '#5865F2' : '#D3D9D4',
                                  borderColor: '#5865F2',
                                  '&:hover': {
                                    backgroundColor: isFollowing ? 'rgba(88, 101, 242, 0.1)' : '#4752C4',
                                    borderColor: '#4752C4',
                                  },
                                  '&.Mui-disabled': {
                                    backgroundColor: 'rgba(88, 101, 242, 0.1)',
                                    color: '#FFFFFF',
                                    borderColor: '#2E3944',
                                  }
                                }}
                              >
                                {isFollowing ? 'Unfollow' : 'Follow'}
                              </Button>
                            </span>
                          </Tooltip>
                        ) : (
                          <Tooltip title="You need to be logged in to follow users">
                            <span>
                              <Button
                                variant="contained"
                                startIcon={<UserPlusIcon className="h-5 w-5" />}
                                onClick={() => toast.error('You need to be logged in to follow users')}
                                sx={{
                                  backgroundColor: '#5865F2',
                                  color: '#ffffff',
                                  '&:hover': {
                                    backgroundColor: '#4752C4',
                                  },
                                }}
                              >
                                Follow
                              </Button>
                            </span>
                          </Tooltip>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-2 md:mt-6">
            <ProfileTabs 
              user={user}
              currentUserId={currentUserId}
              bio={bio}
              bioLastUpdated={bioLastUpdated}
              comments={comments}
              commentsLoading={commentsLoading}
              commentsError={commentsError}
              onBioUpdate={refreshBio}
              privateServers={privateServers}
            />
          </div>
        </div>
      </div>
      <FollowersModal
        isOpen={isFollowersModalOpen}
        onClose={() => setIsFollowersModalOpen(false)}
        userId={user.id}
        isOwnProfile={user.id === currentUserId}
        currentUserId={currentUserId}
        onFollowChange={(type) => {
          if (type === 'remove') {
            setFollowerCount(prev => Math.max(0, prev - 1));
          } else if (type === 'add') {
            setFollowingCount(prev => prev + 1);
          }
        }}
        userData={user}
      />
      <FollowingModal
        isOpen={isFollowingModalOpen}
        onClose={() => setIsFollowingModalOpen(false)}
        userId={user.id}
        isOwnProfile={user.id === currentUserId}
        currentUserId={currentUserId}
        onFollowChange={(isFollowing) => {
          if (isFollowing) {
            setFollowingCount(prev => prev + 1);
          } else {
            setFollowingCount(prev => Math.max(0, prev - 1));
          }
        }}
        userData={user}
      />
    </main>
  );
} 