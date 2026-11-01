"use client";

import { useQuery } from "@tanstack/react-query";
import { useBatchUserData } from "@/hooks/useBatchUserData";
import { Button } from "@/components/ui/button";
import { formatShortDateTime } from "@/utils/helpers/timestamp";
import {
  fetchCopyTree,
  type CopyTreeResponse,
  type CopyTreeSegment,
} from "@/utils/api/copyTree";
import type { RobloxUser } from "@/types";
import { getUserAvatar } from "@/utils/ui/images";
import { TradeHistoryAvatar } from "./TradeHistoryList";
import DupeComparisonLoading from "./DupeComparisonLoading";

function CopySegment({
  segment,
  users,
}: {
  segment: CopyTreeSegment;
  users: Record<string, RobloxUser>;
}) {
  const holderIsLastHop =
    segment.holder?.user_id === segment.hops.at(-1)?.user_id;
  const holderDetails = segment.holder && (
    <div className="text-secondary-text w-full space-y-1 pl-12 text-xs">
      <p className="text-primary-text font-medium">Last recorded holder</p>
      <p>
        {segment.holder.last_seen === null
          ? "Last seen date unavailable"
          : `Last seen ${formatShortDateTime(segment.holder.last_seen)}`}
      </p>
    </div>
  );
  const owner = (id: string) => (
    <a
      href={`https://www.roblox.com/users/${id}/profile`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-link hover:text-link-hover flex min-w-0 items-center gap-2 wrap-anywhere"
    >
      <span className="border-border-card bg-tertiary-bg size-10 shrink-0 overflow-hidden rounded-full border">
        <TradeHistoryAvatar
          avatarUrl={getUserAvatar(id)}
          name={users[id]?.displayName || users[id]?.name || id}
        />
      </span>
      <span className="min-w-0">
        <span className="block">
          {users[id]?.displayName || users[id]?.name || id}
        </span>
        {users[id]?.name && (
          <span className="text-secondary-text block text-xs">
            @{users[id].name}
          </span>
        )}
      </span>
    </a>
  );
  const hop = (entry: CopyTreeSegment["hops"][number], index: number) => (
    <li
      key={index}
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2 text-sm"
    >
      {owner(entry.user_id)}
      <span className="text-secondary-text">
        {formatShortDateTime(entry.trade_time)}
      </span>
      {holderIsLastHop && entry === segment.hops.at(-1) && holderDetails}
    </li>
  );

  return (
    <li
      className={
        segment.attached === "root"
          ? "min-w-0"
          : `before:border-border-card after:border-border-card relative min-w-0 pb-3 pl-3 before:absolute before:top-10 before:left-0 before:w-3 before:border-t-2 after:absolute after:inset-y-0 after:left-0 after:border-l-2 last:pb-0 last:after:bottom-auto last:after:h-10 sm:pl-5 sm:before:w-5 ${segment.attached === "gap" ? "before:border-dashed after:border-dashed" : "before:border-solid after:border-solid"}`
      }
    >
      {segment.attached === "gap" && (
        <div className="text-secondary-text mb-2 text-sm">
          <p className="font-semibold">Earlier trades not recorded</p>
          <p>
            This branch connects somewhere later in the history above, not at
            the point shown.
          </p>
        </div>
      )}
      <div className="bg-secondary-bg border-border-card rounded-lg border p-3">
        {segment.hops.length > 2 ? (
          <>
            <ol>{segment.hops.slice(0, 1).map(hop)}</ol>
            <details className="border-border-card border-y py-2 text-sm">
              <summary className="text-secondary-text cursor-pointer">
                Show {segment.hops.length - 2}{" "}
                {segment.hops.length === 3
                  ? "previous owner"
                  : "previous owners"}
              </summary>
              <ol>{segment.hops.slice(1, -1).map(hop)}</ol>
            </details>
            <ol>{segment.hops.slice(-1).map(hop)}</ol>
          </>
        ) : (
          <ol>{segment.hops.map(hop)}</ol>
        )}
        {segment.split && (
          <div className="border-border-card mt-2 border-t pt-3">
            <span className="border-status-warning/30 bg-status-warning/10 text-status-warning inline-block rounded-md border px-2 py-1 text-xs font-semibold">
              Dupe point · copies split here
            </span>
          </div>
        )}
        {segment.holder && !holderIsLastHop && (
          <div className="border-border-card mt-2 space-y-1 border-t pt-3 text-sm">
            {owner(segment.holder.user_id)}
            {holderDetails}
          </div>
        )}
      </div>
      {segment.children.length > 0 && (
        <ul className="pt-3" aria-label="Dupe branches">
          {segment.children.map((child, index) => (
            <CopySegment key={index} segment={child} users={users} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function CopyTree({
  tree,
  users,
}: {
  tree: CopyTreeResponse;
  users: Record<string, RobloxUser>;
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-primary-text text-sm">
          {tree.copies.toLocaleString()} copies ·{" "}
          {tree.history_entries.toLocaleString()} history entries ·{" "}
          {tree.splits.toLocaleString()} dupe points
        </p>
        <p className="text-secondary-text mt-2 text-sm">
          See every recorded dupe and where its trade history splits. History
          entries count each trade once, even when copies share it. Holders
          reflect the last recorded scan.
        </p>
        <p className="text-secondary-text mt-1 text-sm">
          Solid lines connect recorded trades. Dashed lines mark missing earlier
          trades; their exact connection is unknown.
        </p>
      </div>
      <div className="overflow-x-auto pb-2">
        <ul className="space-y-4" aria-label="Dupe tree roots">
          {tree.roots.map((root, index) => (
            <CopySegment key={index} segment={root} users={users} />
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function CopyTreeView({ id }: { id: string }) {
  const query = useQuery({
    queryKey: ["duplicate-copy-tree", id],
    queryFn: ({ signal }) => fetchCopyTree(id, signal),
    staleTime: 10 * 60_000,
    gcTime: 10 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const ids = new Set<string>();
  const pending = [...(query.data?.roots ?? [])];
  while (pending.length > 0) {
    const segment = pending.pop()!;
    for (const entry of segment.hops) ids.add(entry.user_id);
    if (segment.holder) ids.add(segment.holder.user_id);
    pending.push(...segment.children);
  }
  const { robloxUsers } = useBatchUserData([...ids]);

  if (query.isPending) {
    return <DupeComparisonLoading message="Loading dupe tree..." />;
  }
  if (query.isError) {
    return (
      <div role="alert" className="space-y-3">
        <p className="text-secondary-text">Unable to load the dupe tree.</p>
        <Button onClick={() => void query.refetch()} size="sm">
          Try again
        </Button>
      </div>
    );
  }
  if (!query.data) {
    return (
      <p className="text-secondary-text text-sm">
        No dupe tree history has been recorded for this item yet.
      </p>
    );
  }
  return <CopyTree tree={query.data} users={robloxUsers} />;
}
