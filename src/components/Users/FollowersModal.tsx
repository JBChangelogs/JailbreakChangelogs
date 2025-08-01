import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton, CircularProgress, TextField, InputAdornment } from '@mui/material';
import { XMarkIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { PUBLIC_API_URL } from "@/utils/api";
import { UserAvatar } from '@/utils/avatar';
import Link from 'next/link';
import { getToken } from '@/utils/auth';
import { toast } from 'react-hot-toast';
import { UserSettings } from '@/types/auth';

interface Follower {
  user_id: string;
  follower_id: string;
  created_at: string;
}

interface Following {
  user_id: string;
  following_id: string;
  created_at: string;
}

interface User {
  id: string;
  username: string;
  avatar: string;
  global_name: string;
  usernumber: number;
  accent_color: string;
  custom_avatar?: string;
  settings?: UserSettings;
  premiumtype?: number;
}

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  isOwnProfile: boolean;
  currentUserId: string | null;
  onFollowChange?: (type: 'add' | 'remove') => void;
  userData: User;
}

const FollowersModal: React.FC<FollowersModalProps> = ({
  isOpen,
  onClose,
  userId,
  isOwnProfile,
  currentUserId,
  onFollowChange,
  userData,
}) => {
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [followerDetails, setFollowerDetails] = useState<{ [key: string]: User }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [followingStatus, setFollowingStatus] = useState<{ [key: string]: boolean }>({});
  const [loadingFollow, setLoadingFollow] = useState<{ [key: string]: boolean }>({});
  const [isPrivate, setIsPrivate] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    const fetchFollowers = async () => {
      if (!isOpen) return;
      
      setLoading(true);
      setError(null);
      setIsPrivate(false);
      
      try {
        // Check privacy settings using the passed userData
        if (userData.settings?.hide_followers === 1 && !isOwnProfile) {
          setIsPrivate(true);
          setLoading(false);
          return;
        }

        const response = await fetch(`${PUBLIC_API_URL}/users/followers/get?user=${userId}`);
        
        if (response.status === 404) {
          setFollowers([]);
          onClose();
          return;
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch followers');
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data) || data.length === 0) {
          setFollowers([]);
          onClose();
          return;
        }
        
        setFollowers(data);
        
        // Fetch details for each follower
        const followerIds = data.map((follower: Follower) => follower.follower_id);
        const uniqueFollowerIds = [...new Set(followerIds)];
        
        // Filter out the current user's own ID since we already have that data
        const idsToFetch = uniqueFollowerIds.filter(id => id !== userData.id);
        
        try {
          if (idsToFetch.length > 0) {
            const userResponse = await fetch(`${PUBLIC_API_URL}/users/get/batch?ids=${idsToFetch.join(',')}&nocache=true`);
            if (userResponse.ok) {
              const userDataArray = await userResponse.json();
              const detailsMap = userDataArray.reduce((acc: Record<string, User>, userData: User) => {
                acc[userData.id] = userData;
                return acc;
              }, {});
              
              // Add current user's data if they're in the followers list
              if (followerIds.includes(userData.id)) {
                detailsMap[userData.id] = userData;
              }
              
              setFollowerDetails(detailsMap);
            }
          } else if (followerIds.includes(userData.id)) {
            // Only current user in followers list
            setFollowerDetails({ [userData.id]: userData });
          } else {
            setFollowerDetails({});
          }
        } catch (err) {
          console.error('Error fetching follower details:', err);
          setFollowerDetails({});
        }
      } catch (err) {
        console.error('Error fetching followers:', err);
        setError('Failed to load followers');
      } finally {
        setLoading(false);
        setIsInitialLoad(false);
      }
    };

    if (isInitialLoad) {
      fetchFollowers();
    }
  }, [isOpen, userId, onClose, isOwnProfile, userData, isInitialLoad]);

  useEffect(() => {
    const fetchFollowingStatus = async () => {
      if (!isOpen || !currentUserId) return;

      try {
        const response = await fetch(`${PUBLIC_API_URL}/users/following/get?user=${currentUserId}`);
        if (!response.ok) return;

        const followingData = await response.json();
        if (!Array.isArray(followingData)) return;

        const statusMap = followingData.reduce((acc: { [key: string]: boolean }, follow: Following) => {
          acc[follow.following_id] = true;
          return acc;
        }, {});

        setFollowingStatus(statusMap);
      } catch (err) {
        console.error('Error fetching following status:', err);
      }
    };

    fetchFollowingStatus();
  }, [isOpen, currentUserId]);

  const handleFollow = async (followerId: string) => {
    if (!currentUserId || loadingFollow[followerId]) return;

    setLoadingFollow(prev => ({ ...prev, [followerId]: true }));
    try {
      const token = getToken();
      if (!token) {
        toast.error('You need to be logged in to follow users');
        return;
      }

      const response = await fetch(`${PUBLIC_API_URL}/users/followers/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ follower: token, following: followerId })
      });

      if (!response.ok) {
        throw new Error('Failed to follow user');
      }

      setFollowingStatus(prev => ({ ...prev, [followerId]: true }));
      onFollowChange?.('add');
      toast.success('Successfully followed user');
      
      // Refresh followers list after successful follow
      setIsInitialLoad(true);
    } catch (err) {
      console.error('Error following user:', err);
      toast.error('Failed to follow user');
    } finally {
      setLoadingFollow(prev => ({ ...prev, [followerId]: false }));
    }
  };

  const filteredFollowers = followers.filter(follower => {
    const user = followerDetails[follower.follower_id];
    if (!user) return false;
    const searchLower = searchQuery.toLowerCase();
    return (
      user.username.toLowerCase().includes(searchLower) ||
      (user.global_name && user.global_name.toLowerCase().includes(searchLower))
    );
  });

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          style: {
            backgroundColor: '#212A31',
            color: '#D3D9D4',
            maxHeight: '70vh',
            margin: '8px',
            width: 'calc(100% - 16px)',
          },
        },
      }}
    >
      <DialogTitle className="flex items-center justify-between border-b border-[#2E3944] p-2 sm:p-4">
        <span className="text-muted font-semibold w-full text-center text-sm sm:text-base">Followers</span>
        <IconButton
          onClick={onClose}
          className="text-muted hover:text-[#FFFFFF]"
          size="small"
          sx={{ position: 'absolute', right: 4, top: 4 }}
        >
          <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5 text-[#FFFFFF]" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ padding: '12px !important', overflowY: 'auto' }}>
        {loading ? (
          <div className="flex justify-center py-4 sm:py-8">
            <CircularProgress sx={{ color: '#5865F2' }} />
          </div>
        ) : isPrivate ? (
          <div className="text-center py-4 sm:py-8 text-[#FFFFFF] text-sm">
            This user has hidden their followers
          </div>
        ) : (
          <>
            <div className="mb-2 sm:mb-4">
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5 text-[#FFFFFF]" />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setSearchQuery('')}
                        size="small"
                        className="text-muted hover:text-[#FFFFFF]"
                      >
                        <XMarkIcon className="h-3 w-3 sm:h-4 sm:w-4 text-[#FFFFFF]" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#D3D9D4',
                    backgroundColor: '#1A2228',
                    '& fieldset': {
                      borderColor: '#2E3944',
                    },
                    '&:hover fieldset': {
                      borderColor: '#FFFFFF',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#5865F2',
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: '#D3D9D4',
                    padding: '8px 12px',
                    fontSize: '14px',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: '#FFFFFF',
                    opacity: 1,
                  },
                }}
              />
            </div>
            {error ? (
              <div className="text-center py-4 sm:py-8 text-[#FF6B6B] text-sm">
                {error}
              </div>
            ) : filteredFollowers.length === 0 ? (
              <div className="text-center py-4 sm:py-8 text-[#FFFFFF] text-sm">
                {searchQuery ? 'No results found' : 'No followers yet'}
              </div>
            ) : (
              <div className="space-y-1 sm:space-y-4">
                {filteredFollowers.map((follower) => {
                  const user = followerDetails[follower.follower_id];
                  if (!user) return null;

                  const isCurrentUser = currentUserId === user.id;
                  const isPrivateProfile = user.settings?.profile_public === 0 && !isCurrentUser;

                  return (
                    <div key={follower.follower_id} className="flex items-center justify-between">
                      <Link
                        href={isPrivateProfile ? '#' : `/users/${user.id}`}
                        prefetch={false}
                        className={`flex-1 block p-1.5 sm:p-3 rounded-lg transition-colors ${
                          isPrivateProfile
                            ? 'cursor-not-allowed opacity-75'
                            : 'hover:bg-[#2E3944]'
                        }`}
                        onClick={(e) => {
                          if (isPrivateProfile) {
                            e.preventDefault();
                          }
                        }}
                        title={isPrivateProfile ? "This profile is private" : undefined}
                      >
                        <div className="flex items-center space-x-1.5 sm:space-x-3">
                          {isPrivateProfile ? (
                            <div className="w-10 h-10 rounded-full bg-[#1E2328] flex items-center justify-center border border-[#2E3944]">
                              <svg className="w-5 h-5 text-[#FFFFFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                            </div>
                          ) : (
                            <UserAvatar
                              userId={user.id}
                              avatarHash={user.avatar}
                              username={user.username}
                              size={10}
                              accent_color={user.accent_color}
                              custom_avatar={user.custom_avatar}
                              showBadge={false}
                              settings={user.settings}
                              premiumType={user.premiumtype}
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <h3 className="text-sm sm:text-base font-semibold text-muted truncate max-w-[180px] sm:max-w-[250px]">
                                {isPrivateProfile ? (
                                  "Hidden User"
                                ) : (
                                  user.global_name && user.global_name !== "None" ? user.global_name : user.username
                                )}
                              </h3>
                              {isOwnProfile && !followingStatus[user.id] && (
                                <>
                                  {!loadingFollow[user.id] && <span className="text-[#FFFFFF]">·</span>}
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleFollow(user.id);
                                    }}
                                    disabled={loadingFollow[user.id]}
                                    className="text-[#5865F2] hover:text-[#4752C4] disabled:text-[#FFFFFF] disabled:cursor-not-allowed text-xs sm:text-sm whitespace-nowrap"
                                  >
                                    {loadingFollow[user.id] ? (
                                      <CircularProgress size={10} sx={{ color: '#5865F2' }} />
                                    ) : (
                                      'Follow'
                                    )}
                                  </button>
                                </>
                              )}
                            </div>
                            <p className="text-[10px] sm:text-sm text-[#FFFFFF] truncate max-w-[180px] sm:max-w-[250px]">
                              {isPrivateProfile ? (
                                "Private Profile"
                              ) : (
                                `@${user.username}`
                              )}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FollowersModal; 