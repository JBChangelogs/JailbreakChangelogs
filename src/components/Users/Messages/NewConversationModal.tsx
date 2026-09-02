"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/IconWrapper";
import { Spinner } from "@/components/ui/Spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/utils/ui/avatar";
import { useUserSearch } from "@/hooks/useUserSearch";

interface NewConversationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string | null;
  onSelectUser: (userId: string) => void;
}

export function NewConversationModal({
  open,
  onOpenChange,
  currentUserId,
  onSelectUser,
}: NewConversationModalProps) {
  const [query, setQuery] = useState("");
  const { results, isLoading } = useUserSearch(query, currentUserId);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showClose
        className="bg-secondary-bg flex max-h-[80dvh] max-w-md flex-col overflow-hidden rounded-lg p-0 backdrop-blur-none"
        aria-describedby={undefined}
      >
        <DialogHeader className="px-6 pt-5 pb-2">
          <DialogTitle className="text-primary-text text-base font-bold">
            New conversation
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-2">
          <div className="relative">
            <Icon
              icon="heroicons:magnifying-glass"
              className="text-secondary-text pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
            />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search users to message..."
              className="border-border-card bg-tertiary-bg text-primary-text placeholder-secondary-text focus:border-button-info w-full rounded-md border py-2 pr-9 pl-9 text-sm transition-colors outline-none"
              autoComplete="off"
              spellCheck={false}
            />
            {query.trim() ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-secondary-text hover:text-primary-text absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer transition-colors"
                aria-label="Clear search"
              >
                <Icon icon="heroicons:x-mark" className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
          {!query.trim() ? (
            <p className="text-secondary-text px-4 py-6 text-center text-sm">
              Start typing a username to search.
            </p>
          ) : isLoading ? (
            <div className="flex items-center justify-center px-4 py-10">
              <Spinner className="h-5 w-5" />
            </div>
          ) : results.length === 0 ? (
            <p className="text-secondary-text px-4 py-6 text-center text-sm">
              No users found.
            </p>
          ) : (
            results.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => onSelectUser(user.id)}
                className="hover:bg-tertiary-bg group flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors"
              >
                <UserAvatar
                  userId={user.id}
                  avatarHash={user.avatar}
                  username={user.username}
                  custom_avatar={user.custom_avatar}
                  size={8}
                  showBadge={false}
                  settings={user.settings_v2}
                  premiumType={user.premiumtype}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-primary-text group-hover:text-link truncate text-sm font-medium transition-colors">
                    {user.global_name && user.global_name !== "None"
                      ? user.global_name
                      : user.username}
                  </p>
                  <p className="text-secondary-text truncate text-[11px]">
                    @{user.username}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
