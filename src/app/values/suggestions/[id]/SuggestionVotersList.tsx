"use client";

import { useEffect, useState } from "react";
import {
  fetchValueSuggestionVotes,
  ValueSuggestionVotes,
  ValueSuggestionVoteEntry,
} from "@/utils/api";
import { DefaultAvatar } from "@/utils/avatar";
import Image from "next/image";
import Link from "next/link";

interface SuggestionVotersListProps {
  suggestionId: number;
  refreshKey?: number;
}

export default function SuggestionVotersList({
  suggestionId,
  refreshKey = 0,
}: SuggestionVotersListProps) {
  const [votes, setVotes] = useState<ValueSuggestionVotes | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadVotes = async () => {
      // Only set loading if we don't present data to avoid flashing,
      // but if refreshKey changes we might want to let the user know,
      // or just silently update. Silently updating is usually better UX for "refresh".
      // However, if we initially have no votes, we must show loading.
      if (!votes) {
        setLoading(true);
      }

      try {
        const data = await fetchValueSuggestionVotes(suggestionId);
        if (mounted) {
          setVotes(data);
        }
      } catch (error) {
        console.error("Failed to load votes:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadVotes();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestionId, refreshKey]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="bg-primary-bg mb-2 h-4 w-1/4 rounded"></div>
        <div className="bg-primary-bg border-border-primary h-16 rounded-lg border"></div>
        <div className="bg-primary-bg border-border-primary h-16 rounded-lg border"></div>
        <div className="bg-primary-bg border-border-primary h-16 rounded-lg border"></div>
      </div>
    );
  }

  if (!votes || (votes.upvotes.length === 0 && votes.downvotes.length === 0)) {
    return null;
  }

  // Import type or use it if available in scope.
  // Ideally import { ValueSuggestionVoteEntry } from "@/utils/api" at top if not there.
  // Assuming it is not imported, let's look at imports. It uses ValueSuggestionVotes which contains arrays of ValueSuggestionVoteEntry.

  const renderVoter = (vote: ValueSuggestionVoteEntry, type: "up" | "down") => (
    <div
      key={`${type}-${vote.created_at}-${vote.user?.id}`}
      className="border-border-primary bg-primary-bg hover:border-border-focus flex items-center gap-4 rounded-lg border px-4 py-3 transition-colors"
    >
      <div className="ring-border-primary relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2">
        <DefaultAvatar />
        {vote.user?.avatar && (
          <Image
            src={
              vote.user.avatar
                ? `https://cdn.discordapp.com/avatars/${vote.user.id}/${vote.user.avatar}.png`
                : ""
            }
            alt={vote.user.username || "User"}
            fill
            className="object-cover"
            onError={(e) => {
              (
                e as unknown as { currentTarget: HTMLElement }
              ).currentTarget.style.display = "none";
            }}
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-primary-text mb-1 text-base font-bold">
          <Link
            href={`/users/${vote.user?.id}`}
            prefetch={false}
            className="text-link hover:text-link-hover transition-colors hover:underline"
          >
            {(
              vote.user?.global_name ||
              vote.user?.username ||
              "Unknown"
            ).replace(/(.+)\1/, "$1")}
          </Link>
        </div>
        <div className="text-tertiary-text text-sm font-medium">
          {new Date(vote.created_at * 1000).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="mt-6">
      <h3 className="text-primary-text mb-4 text-lg font-bold">Voters</h3>
      <div className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border-primary hover:scrollbar-thumb-border-focus max-h-[500px] space-y-6 overflow-y-auto pr-2">
        {votes.upvotes.length > 0 && (
          <div>
            <div className="text-button-success mb-3 flex items-center gap-2 text-sm font-bold tracking-wider uppercase">
              <span>↑ Upvotes ({votes.upvotes.length})</span>
            </div>
            <div className="space-y-3">
              {votes.upvotes.map((vote) => renderVoter(vote, "up"))}
            </div>
          </div>
        )}

        {votes.downvotes.length > 0 && (
          <div>
            <div className="text-button-danger mb-3 flex items-center gap-2 text-sm font-bold tracking-wider uppercase">
              <span>↓ Downvotes ({votes.downvotes.length})</span>
            </div>
            <div className="space-y-3">
              {votes.downvotes.map((vote) => renderVoter(vote, "down"))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
