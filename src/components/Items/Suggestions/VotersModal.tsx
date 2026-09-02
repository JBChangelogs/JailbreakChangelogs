"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/utils/ui/avatar";
import { formatShortDateTime } from "@/utils/helpers/timestamp";
import type { SuggestionUser } from "@/components/Items/Suggestions/types";

export interface ActiveVoters {
  up: { created_at: number; user: SuggestionUser }[];
  down: { created_at: number; user: SuggestionUser }[];
  upCount: number;
  downCount: number;
}

interface VotersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tab: "up" | "down";
  onTabChange: (tab: "up" | "down") => void;
  voters: ActiveVoters | null;
}

export function VotersModal({
  open,
  onOpenChange,
  tab: votersTab,
  onTabChange,
  voters: activeVoters,
}: VotersModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showClose
        className="bg-secondary-bg max-w-md rounded-lg p-0 backdrop-blur-none"
        aria-describedby={undefined}
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-primary-text text-left text-xl font-bold">
            Voters
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pt-4 pb-6">
          <Tabs
            value={votersTab}
            onValueChange={(value) => onTabChange(value as "up" | "down")}
          >
            <TabsList fullWidth className="mb-4">
              <TabsTrigger value="up" fullWidth>
                <div className="flex flex-col items-center gap-1 py-1">
                  <span className="text-base font-bold">Upvotes</span>
                  <span className="text-xs font-semibold opacity-80">
                    ({activeVoters?.upCount ?? 0})
                  </span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="down" fullWidth>
                <div className="flex flex-col items-center gap-1 py-1">
                  <span className="text-base font-bold">Downvotes</span>
                  <span className="text-xs font-semibold opacity-80">
                    ({activeVoters?.downCount ?? 0})
                  </span>
                </div>
              </TabsTrigger>
            </TabsList>

            {(["up", "down"] as const).map((tab) => {
              const voters =
                tab === "up"
                  ? (activeVoters?.up ?? [])
                  : (activeVoters?.down ?? []);
              const count =
                tab === "up" ? activeVoters?.upCount : activeVoters?.downCount;
              return (
                <TabsContent key={tab} value={tab}>
                  <div className="max-h-96 space-y-3 overflow-y-auto">
                    {voters.length === 0 ? (
                      <div className="text-secondary-text py-8 text-center">
                        <p className="mb-1 font-semibold">
                          {count === 0
                            ? "No voters to display"
                            : "Voter details not available"}
                        </p>
                        <p className="text-sm">
                          {tab === "up"
                            ? "This suggestion hasn't received any upvotes yet."
                            : "This suggestion hasn't received any downvotes yet."}
                        </p>
                      </div>
                    ) : (
                      voters.map((v) => (
                        <div
                          key={v.user.id + v.created_at}
                          className="border-border-card bg-tertiary-bg flex items-center gap-4 rounded-lg border px-4 py-3 transition-colors"
                        >
                          <div className="relative h-10 w-10 shrink-0">
                            <UserAvatar
                              userId={v.user.id}
                              avatarHash={null}
                              username={
                                v.user.roblox_username ?? v.user.username ?? ""
                              }
                              forceAvatarUrl={v.user.roblox_avatar ?? undefined}
                              premiumType={v.user.premiumtype ?? 0}
                              size={10}
                              showBadge={false}
                              bgClassName="bg-quaternary-bg"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-primary-text mb-1 text-base font-bold">
                              <Link
                                href={`/users/${v.user.id}`}
                                prefetch={false}
                                className="text-link hover:text-link-hover transition-colors hover:underline"
                                onClick={() => onOpenChange(false)}
                              >
                                {v.user.roblox_display_name ||
                                  v.user.roblox_username ||
                                  `User #${v.user.id}`}
                              </Link>
                            </div>
                            <div className="text-tertiary-text text-sm font-medium">
                              {formatShortDateTime(v.created_at)}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>

          <DialogFooter className="mt-4 gap-2 px-0 pt-2 pb-0">
            <DialogClose asChild>
              <Button variant="ghost" size="sm">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
