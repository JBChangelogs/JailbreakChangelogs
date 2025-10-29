"use client";

import { useMemo } from "react";
import { Dialog, DialogTitle } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { getCategoryColor } from "@/utils/categoryIcons";
import { VerifiedBadgeIcon } from "@/components/Icons/VerifiedBadgeIcon";
import { fetchRobloxAvatars, fetchRobloxUsersBatch } from "@/utils/api";

interface TradeHistoryEntry {
  UserId: number;
  TradeTime: number;
}

interface AvatarData {
  targetId: number;
  state: string;
  imageUrl?: string;
  version: string;
}

interface UserData {
  id: number;
  name: string;
  displayName: string;
  hasVerifiedBadge: boolean;
}

interface Item {
  title: string;
  categoryTitle?: string;
  history?: TradeHistoryEntry[] | string;
}

interface TradeHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item | null;
}

export default function TradeHistoryModal({
  isOpen,
  onClose,
  item,
}: TradeHistoryModalProps) {
  const tradeHistoryUserIds = useMemo(() => {
    if (!item?.history || !Array.isArray(item.history)) {
      return [];
    }

    const userIds = new Set<string>();
    item.history.forEach((entry) => {
      userIds.add(entry.UserId.toString());
    });

    return Array.from(userIds);
  }, [item]);

  const { data: tradeHistoryAvatars } = useQuery({
    queryKey: ["tradeHistoryAvatars", tradeHistoryUserIds.sort()],
    queryFn: async () => {
      if (tradeHistoryUserIds.length === 0) {
        return {};
      }

      const avatarData = await fetchRobloxAvatars(tradeHistoryUserIds);
      if (!avatarData) {
        return {};
      }

      const processedAvatars: Record<string, string> = {};
      Object.values(avatarData).forEach((avatar) => {
        if (
          avatar &&
          typeof avatar === "object" &&
          "targetId" in avatar &&
          "state" in avatar &&
          "imageUrl" in avatar
        ) {
          const typedAvatar = avatar as AvatarData;
          if (
            typedAvatar.targetId &&
            typedAvatar.state === "Completed" &&
            typedAvatar.imageUrl
          ) {
            processedAvatars[typedAvatar.targetId.toString()] =
              typedAvatar.imageUrl;
          }
        }
      });

      return processedAvatars;
    },
    enabled: tradeHistoryUserIds.length > 0 && isOpen,
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });

  const { data: tradeHistoryUsers } = useQuery({
    queryKey: ["tradeHistoryUsers", tradeHistoryUserIds.sort()],
    queryFn: async () => {
      if (tradeHistoryUserIds.length === 0) {
        return {};
      }

      const userData = await fetchRobloxUsersBatch(tradeHistoryUserIds);
      if (!userData) {
        return {};
      }

      const processedUsers: Record<
        string,
        { name: string; displayName: string; hasVerifiedBadge: boolean }
      > = {};
      Object.values(userData).forEach((user: UserData) => {
        if (user && user.id) {
          processedUsers[user.id.toString()] = {
            name: user.name || user.id.toString(),
            displayName: user.displayName || user.name || user.id.toString(),
            hasVerifiedBadge: Boolean(user.hasVerifiedBadge),
          };
        }
      });

      return processedUsers;
    },
    enabled: tradeHistoryUserIds.length > 0 && isOpen,
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });

  const getDisplayName = (userId: string) => {
    const cachedUser = tradeHistoryUsers?.[userId];
    if (cachedUser) {
      return cachedUser.displayName;
    }

    return userId;
  };

  const getUsername = (userId: string) => {
    const cachedUser = tradeHistoryUsers?.[userId];
    if (cachedUser) {
      return cachedUser.name;
    }

    return userId;
  };

  const getHasVerifiedBadge = (userId: string) => {
    const cachedUser = tradeHistoryUsers?.[userId];
    if (cachedUser) {
      return cachedUser.hasVerifiedBadge;
    }

    return false;
  };

  const getUserAvatar = (userId: string) => {
    return tradeHistoryAvatars?.[userId] || "";
  };

  const DefaultAvatar = () => (
    <svg
      className="h-6 w-6 text-tertiary-text"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
        clipRule="evenodd"
      />
    </svg>
  );

  if (!item) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="border-border-primary bg-secondary-bg mx-auto max-h-[80vh] w-full max-w-4xl overflow-hidden rounded-lg border">
          <div className="border-border-primary border-b p-4 sm:p-6">
            <div className="flex items-start justify-between gap-4 sm:items-center">
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-primary-text text-lg font-semibold sm:text-xl">
                  Ownership History
                </DialogTitle>
                <div className="flex flex-col gap-1">
                  {item.categoryTitle && (
                    <span
                      className="text-primary-text flex w-fit items-center rounded-full border px-2 py-0.5 text-xs font-medium"
                      style={{
                        borderColor: getCategoryColor(item.categoryTitle),
                        backgroundColor:
                          getCategoryColor(item.categoryTitle) + "20",
                      }}
                    >
                      {item.categoryTitle}
                    </span>
                  )}
                  <p className="text-primary-text truncate text-sm">
                    {item.title}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-secondary-text hover:text-primary-text cursor-pointer rounded-full p-1 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-6">
            {(() => {
              if (
                !item.history ||
                !Array.isArray(item.history) ||
                item.history.length === 0
              ) {
                return (
                  <div className="py-8 text-center">
                    <p className="text-secondary-text">
                      This item has no ownership history.
                    </p>
                  </div>
                );
              }

              const owners = item.history.slice();

              if (owners.length === 0) {
                return (
                  <div className="py-8 text-center">
                    <p className="text-secondary-text">
                      This item has no ownership history.
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-2">
                  {owners.map((owner, index) => {
                    const userId = owner.UserId.toString();

                    return (
                      <div
                        key={`${userId}-${owner.TradeTime}-${index}`}
                        className="border-border-primary bg-primary-bg flex items-center gap-3 rounded-lg border p-3"
                      >
                        <div className="flex-shrink-0">
                          {getUserAvatar(userId) ? (
                            <Image
                              src={getUserAvatar(userId)!}
                              alt="User Avatar"
                              width={40}
                              height={40}
                              className="rounded-full bg-tertiary-bg"
                            />
                          ) : (
                            <div className="bg-tertiary-bg flex h-10 w-10 items-center justify-center rounded-full">
                              <DefaultAvatar />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <a
                            href={`https://www.roblox.com/users/${userId}/profile`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                          >
                            <div className="text-link hover:text-link-hover flex items-center gap-1.5 font-medium transition-colors">
                              {getDisplayName(userId)}
                              {getHasVerifiedBadge(userId) && (
                                <VerifiedBadgeIcon className="h-4 w-4" />
                              )}
                            </div>
                            <div className="text-secondary-text text-sm">
                              @{getUsername(userId)}
                            </div>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
