'use client';

import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, UserGroupIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Pagination } from '@mui/material';
import Link from 'next/link';
import { UserData } from '@/types/auth';
import RobloxUserCard from '@/components/Users/RobloxUserCard';
import DiscordUserCard from '@/components/Users/DiscordUserCard';
import UserTypeTabs from '@/components/Users/UserTypeTabs';
import { useDebounce } from '@/hooks/useDebounce';
import { Tooltip } from '@mui/material';
import { UserDetailsTooltip } from './UserDetailsTooltip';

interface UserSearchProps {
  initialUsers: UserData[];
}

export default function UserSearch({ initialUsers }: UserSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userType, setUserType] = useState<'discord' | 'roblox'>('discord');
  const usersPerPage = 15;
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    const checkAuthStatus = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setCurrentUserId(userData.id);
        } catch (error) {
          console.error('Error parsing user data:', error);
          setCurrentUserId(null);
        }
      } else {
        setCurrentUserId(null);
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

  const filteredUsers = initialUsers.filter(user => {
    const searchLower = debouncedSearchQuery.toLowerCase();
    const isIdSearch = /^\d{18,19}$/.test(debouncedSearchQuery);
    
    if (userType === 'roblox') {
      if (!user.roblox_id) return false;
      
      if (isIdSearch) {
        return user.id === debouncedSearchQuery;
      }
      
      return (
        (user.roblox_username && user.roblox_username.toLowerCase().startsWith(searchLower)) ||
        (user.roblox_display_name && user.roblox_display_name.toLowerCase().startsWith(searchLower))
      );
    } else {
      if (isIdSearch) {
        return user.id === debouncedSearchQuery;
      }
      
      return (
        user.username.toLowerCase().startsWith(searchLower) ||
        (user.global_name && user.global_name.toLowerCase().startsWith(searchLower))
      );
    }
  });

  const indexOfLastUser = page * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        const pageNumber = parseInt(hash);
        if (!isNaN(pageNumber) && pageNumber > 0 && pageNumber <= totalPages) {
          setPage(pageNumber);
        } else {
          setPage(1);
          history.pushState(null, '', window.location.pathname);
        }
      } else {
        setPage(1);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [totalPages]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    if (value === 1) {
      history.pushState(null, '', window.location.pathname);
    } else {
      window.location.hash = value.toString();
    }
  };

  return (
    <div className="flex flex-col gap-4 mb-8">
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-4 w-4 text-[#FFFFFF]" />
          </div>
          <input
            type="text"
            placeholder={`Search ${userType === 'roblox' ? 'Roblox' : 'Discord'} users...`}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-9 py-2 rounded-lg bg-[#212A31] border border-[#2E3944] text-muted placeholder-muted focus:outline-none focus:border-[#5865F2] text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#FFFFFF] hover:text-muted transition-colors"
              aria-label="Clear search"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <UserTypeTabs
          userType={userType}
          onUserTypeChange={(newType) => {
            setUserType(newType);
            setPage(1);
          }}
        />
        <div className="flex items-center gap-2 text-sm text-muted whitespace-nowrap">
          <UserGroupIcon className="h-4 w-4" />
          <span>
            {debouncedSearchQuery 
              ? `Found ${filteredUsers.length.toLocaleString()} ${userType === 'roblox' ? 'Roblox' : 'Discord'} ${filteredUsers.length === 1 ? 'user' : 'users'} matching "${debouncedSearchQuery}"`
              : `Total ${userType === 'roblox' ? 'Roblox' : 'Discord'} Users: ${filteredUsers.length.toLocaleString()}`
            }
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
        {currentUsers.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-muted text-lg">No users found</p>
            <p className="text-[#FFFFFF] text-sm mt-2">
              {debouncedSearchQuery 
                ? `No ${userType === 'roblox' ? 'Roblox' : 'Discord'} users match "${debouncedSearchQuery}"` 
                : `No ${userType === 'roblox' ? 'Roblox' : 'Discord'} users available`
              }
            </p>
          </div>
        ) : (
          currentUsers.map((user) => (
            <Tooltip
              key={user.id}
              title={user.settings?.profile_public === 0 && currentUserId !== user.id ? null : <UserDetailsTooltip user={user} />}
              arrow
              disableTouchListener
              slotProps={{
                tooltip: {
                  sx: {
                    bgcolor: '#1A2228',
                    border: '1px solid #2E3944',
                    maxWidth: '400px',
                    width: 'auto',
                    minWidth: '300px',
                    '& .MuiTooltip-arrow': {
                      color: '#1A2228',
                    },
                  },
                },
              }}
            >
              <Link
                href={user.settings?.profile_public === 0 && currentUserId !== user.id ? '#' : `/users/${user.id}`}
                className={`block bg-[#212A31] p-4 rounded-lg shadow-md border border-[#2E3944] ${
                  user.settings?.profile_public === 0 && currentUserId !== user.id
                    ? 'cursor-not-allowed opacity-75'
                    : 'hover:border-blue-300 group'
                } transition-colors`}
                onClick={(e) => {
                  if (user.settings?.profile_public === 0 && currentUserId !== user.id) {
                    e.preventDefault();
                  }
                }}
              >
                <div className="flex items-center space-x-3">
                  {userType === 'roblox' ? (
                    <RobloxUserCard user={user} currentUserId={currentUserId} />
                  ) : (
                    <DiscordUserCard user={user} currentUserId={currentUserId} />
                  )}
                </div>
              </Link>
            </Tooltip>
          ))
        )}
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            sx={{
              '& .MuiPaginationItem-root': {
                color: '#D3D9D4',
                '&.Mui-selected': {
                  backgroundColor: '#5865F2',
                  '&:hover': {
                    backgroundColor: '#4752C4',
                  },
                },
                '&:hover': {
                  backgroundColor: '#2E3944',
                },
              },
            }}
          />
        </div>
      )}
    </div>
  );
} 