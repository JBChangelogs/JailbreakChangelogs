"use client";

import { useState, useEffect } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Pagination } from "@mui/material";
import Link from "next/link";
import { UserData } from "@/types/auth";
import RobloxUserCard from "@/components/Users/RobloxUserCard";
import DiscordUserCard from "@/components/Users/DiscordUserCard";
import UserTypeTabs from "@/components/Users/UserTypeTabs";
import { useDebounce } from "@/hooks/useDebounce";
import dynamic from "next/dynamic";

const Tooltip = dynamic(() => import("@mui/material/Tooltip"), { ssr: false });
import { UserDetailsTooltip } from "./UserDetailsTooltip";
import { useAuthContext } from "@/contexts/AuthContext";

interface UserSearchProps {
  initialUsers: UserData[];
}

export default function UserSearch({ initialUsers }: UserSearchProps) {
  const { user } = useAuthContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userType, setUserType] = useState<"discord" | "roblox">("discord");
  const usersPerPage = 21;

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (user) {
      setCurrentUserId(user.id);
    } else {
      setCurrentUserId(null);
    }
  }, [user]);

  const filteredUsers = initialUsers.filter((user) => {
    const searchLower = debouncedSearchQuery.trim().toLowerCase();
    const isIdSearch = /^\d{18,19}$/.test(debouncedSearchQuery);

    if (userType === "roblox") {
      if (!user.roblox_id) return false;

      if (isIdSearch) {
        return user.id === debouncedSearchQuery;
      }

      return (
        (user.roblox_username &&
          user.roblox_username.toLowerCase().includes(searchLower)) ||
        (user.roblox_display_name &&
          user.roblox_display_name.toLowerCase().includes(searchLower))
      );
    } else {
      if (isIdSearch) {
        return user.id === debouncedSearchQuery;
      }

      return (
        user.username.toLowerCase().includes(searchLower) ||
        (user.global_name &&
          user.global_name.toLowerCase().includes(searchLower))
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
          history.pushState(null, "", window.location.pathname);
        }
      } else {
        setPage(1);
      }
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [totalPages]);

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setPage(value);
    if (value === 1) {
      history.pushState(null, "", window.location.pathname);
    } else {
      window.location.hash = value.toString();
    }
  };

  return (
    <div className="mb-8 flex flex-col gap-4">
      <div className="flex max-w-md flex-1 items-center gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder={`Search ${userType === "roblox" ? "Roblox" : "Discord"} users...`}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="text-muted w-full rounded-lg border border-[#2E3944] bg-[#37424D] px-4 py-2 pr-10 pl-10 placeholder-[#D3D9D4] focus:border-[#124E66] focus:outline-none"
          />
          <MagnifyingGlassIcon className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-[#FFFFFF]" />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setPage(1);
              }}
              className="hover:text-muted absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 text-[#FFFFFF]"
              aria-label="Clear search"
            >
              <XMarkIcon />
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <UserTypeTabs
          userType={userType}
          onUserTypeChange={(newType) => {
            setUserType(newType);
            setPage(1);
          }}
        />
        <div className="text-muted flex items-center gap-2 text-sm">
          <span>
            {(() => {
              const MAX_QUERY_DISPLAY = 32;
              const displayQuery =
                debouncedSearchQuery &&
                debouncedSearchQuery.length > MAX_QUERY_DISPLAY
                  ? debouncedSearchQuery.slice(0, MAX_QUERY_DISPLAY) + "..."
                  : debouncedSearchQuery;
              return debouncedSearchQuery
                ? `Found ${filteredUsers.length.toLocaleString()} ${userType === "roblox" ? "Roblox" : "Discord"} ${filteredUsers.length === 1 ? "user" : "users"} matching "${displayQuery}"`
                : `Total ${userType === "roblox" ? "Roblox" : "Discord"} Users: ${filteredUsers.length.toLocaleString()}`;
            })()}
          </span>
        </div>
      </div>
      <div className="mb-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {currentUsers.length === 0 ? (
          <div className="col-span-full py-8 text-center">
            <p className="text-muted text-lg">No users found</p>
            <p className="mt-2 text-sm text-[#FFFFFF]">
              {(() => {
                const MAX_QUERY_DISPLAY = 32;
                const displayQuery =
                  debouncedSearchQuery &&
                  debouncedSearchQuery.length > MAX_QUERY_DISPLAY
                    ? debouncedSearchQuery.slice(0, MAX_QUERY_DISPLAY) + "..."
                    : debouncedSearchQuery;
                return debouncedSearchQuery
                  ? `No ${userType === "roblox" ? "Roblox" : "Discord"} users match "${displayQuery}"`
                  : `No ${userType === "roblox" ? "Roblox" : "Discord"} users available`;
              })()}
            </p>
          </div>
        ) : (
          currentUsers.map((user) => (
            <Tooltip
              key={user.id}
              title={
                user.settings?.profile_public === 0 &&
                currentUserId !== user.id ? null : (
                  <UserDetailsTooltip user={user} />
                )
              }
              arrow
              disableTouchListener
              slotProps={{
                tooltip: {
                  sx: {
                    bgcolor: "#1A2228",
                    border: "1px solid #2E3944",
                    maxWidth: "400px",
                    width: "auto",
                    minWidth: "300px",
                    "& .MuiTooltip-arrow": {
                      color: "#1A2228",
                    },
                  },
                },
              }}
            >
              <Link
                href={
                  user.settings?.profile_public === 0 &&
                  currentUserId !== user.id
                    ? "#"
                    : `/users/${user.id}`
                }
                prefetch={false}
                className={`block rounded-lg border border-[#2E3944] bg-[#212A31] p-4 shadow-md ${
                  user.settings?.profile_public === 0 &&
                  currentUserId !== user.id
                    ? "cursor-not-allowed opacity-75"
                    : "group hover:border-blue-300"
                } transition-colors`}
                onClick={(e) => {
                  if (
                    user.settings?.profile_public === 0 &&
                    currentUserId !== user.id
                  ) {
                    e.preventDefault();
                  }
                }}
              >
                <div className="flex items-center space-x-3">
                  {userType === "roblox" ? (
                    <RobloxUserCard user={user} currentUserId={currentUserId} />
                  ) : (
                    <DiscordUserCard
                      user={user}
                      currentUserId={currentUserId}
                    />
                  )}
                </div>
              </Link>
            </Tooltip>
          ))
        )}
      </div>
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            sx={{
              "& .MuiPaginationItem-root": {
                color: "#D3D9D4",
                "&.Mui-selected": {
                  backgroundColor: "#5865F2",
                  "&:hover": {
                    backgroundColor: "#4752C4",
                  },
                },
                "&:hover": {
                  backgroundColor: "#2E3944",
                },
              },
            }}
          />
        </div>
      )}
    </div>
  );
}
