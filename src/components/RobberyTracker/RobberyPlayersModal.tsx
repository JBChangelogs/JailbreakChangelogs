"use client";

import { Dialog, DialogPanel } from "@headlessui/react";
import { useState, useMemo } from "react";
import Image from "next/image";
import { useRobloxBotsDataQuery } from "@/hooks/useRobloxDataQuery";
import { Icon } from "@/components/ui/IconWrapper";
import { DefaultAvatar } from "@/utils/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Player {
  user_id: string;
  username: string | null;
  team: string;
  level: number;
  has_season_pass: boolean;
  money: number;
  xp: number;
  gamepasses: string[];
}

interface RobberyPlayersModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
}

export default function RobberyPlayersModal({
  isOpen,
  onClose,
  players,
}: RobberyPlayersModalProps) {
  const [activeTab, setActiveTab] = useState<"All" | "Police" | "Criminal">(
    "All",
  );

  // Collect all user IDs to fetch their display names and avatars
  const playerIds = useMemo(() => {
    return players.map((p) => p.user_id);
  }, [players]);

  // Fetch user data (names, avatars, etc.) - only when modal is open
  const { data: robloxData } = useRobloxBotsDataQuery(
    isOpen ? playerIds : null,
  );

  const filteredPlayers = useMemo(() => {
    if (activeTab === "All") return players;
    // Map "Criminals" tab to "Criminal" team name if needed, or just match exactly
    const teamName = activeTab === "Criminal" ? "Criminal" : "Police";
    return players.filter((p) => p.team === teamName);
  }, [activeTab, players]);

  const getEmptyMessage = () => {
    if (activeTab === "Police") return "No cops found";
    if (activeTab === "Criminal") return "No criminals found";
    return "No players found";
  };

  // Helper to get user display name
  const getUserDisplay = (userId: string) => {
    if (!robloxData?.usersData) return userId;
    const user = robloxData.usersData[userId];
    return user?.displayName || user?.name || userId;
  };

  const getUsername = (userId: string) => {
    if (!robloxData?.usersData) return `@${userId}`;
    const user = robloxData.usersData[userId];
    return user?.name ? `@${user.name}` : `@${userId}`;
  };

  const getUserAvatar = (userId: string) => {
    return `${process.env.NEXT_PUBLIC_INVENTORY_API_URL}/proxy/users/${userId}/avatar-headshot`;
  };

  const copsCount = useMemo(
    () => players.filter((p) => p.team === "Police").length,
    [players],
  );
  const criminalsCount = useMemo(
    () => players.filter((p) => p.team === "Criminal").length,
    [players],
  );

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-[3000]">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="border-border-card bg-secondary-bg hover:border-border-focus relative flex max-h-[80vh] w-full max-w-[600px] min-w-[320px] flex-col overflow-hidden rounded-lg border shadow-xl">
          {/* Header */}
          <div className="border-border-card flex items-center justify-between border-b px-6 py-4">
            <h2 className="text-primary-text text-xl font-semibold">
              {filteredPlayers.length}{" "}
              {activeTab === "Police"
                ? filteredPlayers.length === 1
                  ? "Cop Player"
                  : "Cop Players"
                : activeTab === "Criminal"
                  ? filteredPlayers.length === 1
                    ? "Criminal Player"
                    : "Criminal Players"
                  : filteredPlayers.length === 1
                    ? "Player"
                    : "Players"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="text-secondary-text hover:text-primary-text hover:bg-quaternary-bg focus-visible:ring-ring inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:ring-1 focus-visible:outline-none"
            >
              <Icon icon="heroicons:x-mark" className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-border-card border-b px-6">
            <Tabs
              value={activeTab}
              onValueChange={(value) =>
                setActiveTab(value as "All" | "Police" | "Criminal")
              }
            >
              <TabsList fullWidth className="my-3">
                <TabsTrigger value="All" fullWidth>
                  Players ({players.length})
                </TabsTrigger>
                <TabsTrigger value="Police" fullWidth>
                  Cops ({copsCount})
                </TabsTrigger>
                <TabsTrigger value="Criminal" fullWidth>
                  Crims ({criminalsCount})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {filteredPlayers.length > 0 ? (
              <div className="space-y-3">
                {filteredPlayers.map((player) => (
                  <div
                    key={player.user_id}
                    className="border-border-card bg-tertiary-bg flex items-center gap-3 rounded-lg border p-3"
                  >
                    {/* Avatar */}
                    <div className="bg-tertiary-bg h-10 w-10 shrink-0 overflow-hidden rounded-full">
                      {robloxData?.usersData ? (
                        <Image
                          src={getUserAvatar(player.user_id)}
                          alt={getUsername(player.user_id)}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src =
                              "/assets/images/Placeholder.webp";
                          }}
                        />
                      ) : (
                        <DefaultAvatar />
                      )}
                    </div>

                    {/* User Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <a
                          href={`https://www.roblox.com/users/${player.user_id}/profile`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-text hover:text-link truncate font-medium transition-colors"
                        >
                          {getUserDisplay(player.user_id)}
                        </a>
                        <span
                          className={`text-primary-text inline-flex h-6 items-center rounded-lg border px-2.5 text-xs leading-none font-medium shadow-2xl backdrop-blur-xl ${
                            player.team === "Police"
                              ? "border-blue-500/30 bg-blue-500/20"
                              : "border-red-500/30 bg-red-500/20"
                          }`}
                        >
                          {player.team === "Police" ? "Police" : "Criminal"}
                        </span>
                      </div>
                      <div className="text-secondary-text text-sm">
                        {getUsername(player.user_id)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-secondary-text py-8 text-center">
                {getEmptyMessage()}
              </div>
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
