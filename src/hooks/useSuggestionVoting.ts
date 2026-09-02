"use client";

import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { createLogger } from "@/services/logger";
import { useAuthContext } from "@/contexts/AuthContext";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { PUBLIC_API_URL } from "@/utils/api/api";
import { parseBan, showBanToast } from "@/utils/api/ban";
import type {
  Suggestion,
  SuggestionsResponse,
  SuggestionUser,
} from "@/components/Items/Suggestions/types";

const log = createLogger("API");

type AuthContextValue = ReturnType<typeof useAuthContext>;

interface UseSuggestionVotingOptions {
  setSuggestions: Dispatch<SetStateAction<Suggestion[]>>;
  user: AuthContextValue["user"];
  isAuthenticated: boolean;
  setLoginModal: AuthContextValue["setLoginModal"];
  setBan: AuthContextValue["setBan"];
  sort: string | null;
  page: number;
}

export function useSuggestionVoting({
  setSuggestions,
  user,
  isAuthenticated,
  setLoginModal,
  setBan,
  sort,
  page,
}: UseSuggestionVotingOptions) {
  // Per-suggestion voting loading state
  const [votingIds, setVotingIds] = useState<Set<number>>(new Set());
  const [votingTypes, setVotingTypes] = useState<
    Map<number, "upvote" | "downvote">
  >(new Map());
  const [voteRateLimits, setVoteRateLimits] = useState<Map<number, number>>(
    new Map(),
  );

  const handleVote = async (
    suggestion: Suggestion,
    type: "upvote" | "downvote",
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info("You need to be logged in to vote on item suggestions.");
      setLoginModal({ open: true });
      return;
    }
    if (votingIds.has(suggestion.id)) return;

    const wasUpvoted = suggestion.votes.upvotes.some(
      (v) => v.user.id === user?.id,
    );
    const wasDownvoted = suggestion.votes.downvotes.some(
      (v) => v.user.id === user?.id,
    );
    const removing = type === "upvote" ? wasUpvoted : wasDownvoted;

    setSuggestions((prev) =>
      prev.map((s) => {
        if (s.id !== suggestion.id) return s;
        let upvotes = s.upvotes;
        let downvotes = s.downvotes;
        let newUpvoters = s.votes.upvotes;
        let newDownvoters = s.votes.downvotes;
        if (removing) {
          if (type === "upvote") {
            upvotes--;
            newUpvoters = newUpvoters.filter((v) => v.user.id !== user!.id);
          } else {
            downvotes--;
            newDownvoters = newDownvoters.filter((v) => v.user.id !== user!.id);
          }
        } else {
          if (wasUpvoted) {
            upvotes--;
            newUpvoters = newUpvoters.filter((v) => v.user.id !== user!.id);
          }
          if (wasDownvoted) {
            downvotes--;
            newDownvoters = newDownvoters.filter((v) => v.user.id !== user!.id);
          }
          if (type === "upvote") {
            upvotes++;
            newUpvoters = [
              ...newUpvoters,
              { created_at: Date.now(), user: user! },
            ];
          } else {
            downvotes++;
            newDownvoters = [
              ...newDownvoters,
              { created_at: Date.now(), user: user! },
            ];
          }
        }
        return {
          ...s,
          upvotes: Math.max(0, upvotes),
          downvotes: Math.max(0, downvotes),
          votes: { upvotes: newUpvoters, downvotes: newDownvoters },
        };
      }),
    );

    setVotingIds((prev) => new Set(prev).add(suggestion.id));
    setVotingTypes((prev) => new Map(prev).set(suggestion.id, type));
    try {
      const { url, headers } = buildApiFetchRequest(
        PUBLIC_API_URL!,
        `/value-suggestions/${suggestion.id}/vote`,
      );
      const res = await fetch(url, {
        method: removing ? "DELETE" : "POST",
        credentials: "include",
        ...(removing
          ? { headers }
          : {
              headers: { ...headers, "Content-Type": "application/json" },
              body: JSON.stringify({ vote_type: type }),
            }),
      });
      if (!res.ok) {
        // Revert
        setSuggestions((prev) =>
          prev.map((s) => (s.id === suggestion.id ? suggestion : s)),
        );
        const banInfo = parseBan(res);
        if (banInfo) {
          setBan(banInfo);
          showBanToast(banInfo);
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (res.status === 429) {
          toast.error("You're voting too fast. Please wait a moment.");
          const retryAfter = parseInt(
            res.headers.get("retry-after") ?? "60",
            10,
          );
          const until = Date.now() + retryAfter * 1000;
          setVoteRateLimits((prev) => new Map(prev).set(suggestion.id, until));
          setTimeout(
            () => {
              setVoteRateLimits((prev) => {
                const next = new Map(prev);
                next.delete(suggestion.id);
                return next;
              });
            },
            retryAfter * 1000 + 500,
          );
        } else if (res.status === 403) {
          if (data?.detail === "Forbidden") {
            toast.info(
              "You need to connect your Roblox account to vote on item suggestions.",
            );
            setLoginModal({ open: true, tab: "roblox", onlyRoblox: true });
          } else {
            toast.error(
              data?.message ?? data?.error ?? "Failed to register vote.",
            );
          }
        } else {
          log.error(`Vote failed ${res.status}`, data);
          toast.error(
            data?.message ?? data?.error ?? "Failed to register vote.",
          );
        }
      }
    } catch (err) {
      log.error("Vote request threw", err);
      setSuggestions((prev) =>
        prev.map((s) => (s.id === suggestion.id ? suggestion : s)),
      );
      toast.error("Failed to register vote.");
    } finally {
      setVotingIds((prev) => {
        const n = new Set(prev);
        n.delete(suggestion.id);
        return n;
      });
      setVotingTypes((prev) => {
        const n = new Map(prev);
        n.delete(suggestion.id);
        return n;
      });
    }
  };

  // Voters modal state
  const [votersOpen, setVotersOpen] = useState(false);
  const [votersTab, setVotersTab] = useState<"up" | "down">("up");
  const openVotersSuggestionIdRef = useRef<number | null>(null);
  const [activeVoters, setActiveVoters] = useState<{
    up: { created_at: number; user: SuggestionUser }[];
    down: { created_at: number; user: SuggestionUser }[];
    upCount: number;
    downCount: number;
  } | null>(null);

  const openVotersModal = (
    suggestion: Suggestion,
    tab: "up" | "down",
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    e.preventDefault();
    openVotersSuggestionIdRef.current = suggestion.id;
    setActiveVoters({
      up: suggestion.votes.upvotes,
      down: suggestion.votes.downvotes,
      upCount: suggestion.upvotes,
      downCount: suggestion.downvotes,
    });
    setVotersTab(tab);
    setVotersOpen(true);
  };

  const syncActiveVoters = useCallback(
    (id: number, votes: Suggestion["votes"]) => {
      if (openVotersSuggestionIdRef.current !== id) return;
      setActiveVoters({
        up: votes.upvotes,
        down: votes.downvotes,
        upCount: votes.upvotes.length,
        downCount: votes.downvotes.length,
      });
    },
    [],
  );

  const silentRefreshVotes = useCallback(
    async (id?: number | null) => {
      try {
        if (id != null) {
          const { url, headers } = buildApiFetchRequest(
            PUBLIC_API_URL!,
            `/value-suggestions/${id}/votes`,
          );
          const response = await fetch(url, {
            credentials: "include",
            headers,
          });
          if (!response.ok) return;
          const fresh: Suggestion["votes"] = await response.json();
          setSuggestions((previous) =>
            previous.map((suggestion) =>
              suggestion.id === id
                ? {
                    ...suggestion,
                    upvotes: fresh.upvotes.length,
                    downvotes: fresh.downvotes.length,
                    votes: fresh,
                  }
                : suggestion,
            ),
          );
          syncActiveVoters(id, fresh);
          return;
        }

        const query = new URLSearchParams({ page: String(page) });
        if (sort !== null) query.set("sort", sort);
        const { url, headers } = buildApiFetchRequest(
          PUBLIC_API_URL!,
          `/value-suggestions/recent?${query}`,
        );
        const response = await fetch(url, {
          credentials: "include",
          headers,
        });
        if (!response.ok) return;
        const data: SuggestionsResponse = await response.json();
        const freshById = new Map(
          data.items.map((suggestion) => [suggestion.id, suggestion]),
        );
        setSuggestions((previous) =>
          previous.map((suggestion) => {
            const fresh = freshById.get(suggestion.id);
            return fresh
              ? {
                  ...suggestion,
                  upvotes: fresh.upvotes,
                  downvotes: fresh.downvotes,
                  votes: fresh.votes,
                }
              : suggestion;
          }),
        );
      } catch {
        // Stale vote counts are acceptable until the next refresh.
      }
    },
    [page, setSuggestions, sort, syncActiveVoters],
  );

  useEffect(() => {
    const handler = (event: Event) => {
      const realtimeEvent = event as CustomEvent<{
        action?: string;
        type?: string;
        id?: number | null;
      }>;
      if (realtimeEvent.detail?.action !== "refresh_suggestions") return;
      const type = realtimeEvent.detail?.type;
      if (type === "vote" || type === "unvote") {
        void silentRefreshVotes(realtimeEvent.detail.id);
      }
    };
    window.addEventListener("realtimeSuggestions", handler);
    return () => window.removeEventListener("realtimeSuggestions", handler);
  }, [silentRefreshVotes]);

  return {
    votingIds,
    votingTypes,
    voteRateLimits,
    handleVote,
    votersOpen,
    votersTab,
    activeVoters,
    openVotersModal,
    setVotersOpen,
    setVotersTab,
    openVotersSuggestionIdRef,
  };
}
