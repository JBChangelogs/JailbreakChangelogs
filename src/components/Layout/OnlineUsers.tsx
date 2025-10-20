"use client";

import React from "react";
import { useOnlineUsersPolling } from "@/hooks/useOnlineUsersPolling";
import Image from "next/image";
import { Skeleton } from "@mui/material";
import Link from "next/link";
import { DefaultAvatar } from "@/utils/avatar";

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
        <div className="flex items-center -space-x-6">
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
      <div className="flex items-center -space-x-4">
        {visibleUsers.map((user, index) => (
          <Link
            key={user.id}
            href={`/users/${user.id}`}
            prefetch={false}
            className="relative inline-block h-8 w-8 rounded-full border-2 border-white object-cover object-center hover:z-10 focus:z-10"
            style={{ zIndex: index + 1 }}
          >
            {user.avatar && user.avatar !== "None" ? (
              <Image
                src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}?size=128`}
                alt={`${user.username}'s avatar`}
                fill
                className="object-cover rounded-full"
                draggable={false}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-tertiary-bg rounded-full">
                <DefaultAvatar />
              </div>
            )}
          </Link>
        ))}
        {hiddenCount > 0 && (
          <div
            className="relative h-8 w-8 rounded-full border-2 border-white bg-button-info flex items-center justify-center text-xs font-medium text-white hover:z-10 focus:z-10"
            style={{ zIndex: 10 }}
          >
            +{hiddenCount}
          </div>
        )}
      </div>
      <span className="text-secondary-text text-sm">{totalUsers} online</span>
    </div>
  );
}
