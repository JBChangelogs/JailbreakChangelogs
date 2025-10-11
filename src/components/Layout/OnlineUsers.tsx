"use client";

import React from "react";
import { useOnlineUsersPolling } from "@/hooks/useOnlineUsersPolling";
import Image from "next/image";
import { Skeleton } from "@mui/material";
import Link from "next/link";

interface OnlineUser {
  id: string;
  username: string;
  global_name: string;
  avatar: string;
  created_at: string;
  premiumtype: number;
  usernumber: number;
  last_seen: number;
}

interface OnlineUsersProps {
  max?: number;
  className?: string;
  initial?: OnlineUser[];
}

export default function OnlineUsers({
  max = 4,
  className = "",
  initial,
}: OnlineUsersProps) {
  const { onlineUsers, isLoading, error } = useOnlineUsersPolling(30000);

  // Use polling data if available, otherwise fall back to initial data
  const users = onlineUsers || initial || [];

  if (isLoading && !users.length) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="flex -space-x-2">
          {[...Array(max)].map((_, i) => (
            <Skeleton key={i} variant="circular" width={32} height={32} />
          ))}
        </div>
        <span className="text-secondary-text text-sm">
          Loading online users...
        </span>
      </div>
    );
  }

  if (error || users.length === 0) {
    return null; // Don't show anything if there's an error or no users
  }

  const visibleUsers = users.slice(0, max);
  const totalUsers = users.length;
  const hiddenCount = totalUsers - max;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex -space-x-2">
        {visibleUsers.map((user, index) => (
          <Link
            key={user.id}
            href={`/users/${user.id}`}
            prefetch={false}
            className="border-border-primary hover:border-border-focus relative h-8 w-8 cursor-pointer overflow-hidden rounded-full border-2 transition-colors"
            style={{ zIndex: visibleUsers.length - index }}
          >
            {user.avatar && user.avatar !== "None" ? (
              <Image
                src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}?size=128`}
                alt={`${user.username}'s avatar`}
                fill
                className="object-cover"
                draggable={false}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <svg
                  className="text-secondary-text h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="12"
                    fill="var(--color-tertiary-bg)"
                  />
                  <path
                    d="M12 13.5C14.4853 13.5 16.5 11.4853 16.5 9C16.5 6.51472 14.4853 4.5 12 4.5C9.51472 4.5 7.5 6.51472 7.5 9C7.5 11.4853 9.51472 13.5 12 13.5Z"
                    fill="var(--color-secondary-text)"
                  />
                  <path
                    d="M12 15C8.13401 15 5 18.134 5 22H19C19 18.134 15.866 15 12 15Z"
                    fill="var(--color-secondary-text)"
                  />
                </svg>
              </div>
            )}
          </Link>
        ))}
        {hiddenCount > 0 && (
          <div
            className="border-border-primary bg-button-info text-form-button-text relative flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-medium"
            style={{ zIndex: 0 }}
          >
            +{hiddenCount}
          </div>
        )}
      </div>
      <span className="text-secondary-text text-sm">{totalUsers} online</span>
    </div>
  );
}
