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

function OwnerIdentity({
  id,
  users,
  nested = false,
}: {
  id: string;
  users: Record<string, RobloxUser>;
  nested?: boolean;
}) {
  return (
    <a
      href={`https://www.roblox.com/users/${id}/profile`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-link hover:text-link-hover flex min-w-0 items-center gap-2 wrap-anywhere"
    >
      <span
        className={`border-border-card size-10 shrink-0 overflow-hidden rounded-full border ${nested ? "bg-quaternary-bg" : "bg-tertiary-bg"}`}
      >
        <TradeHistoryAvatar
          avatarUrl={getUserAvatar(id)}
          name={users[id]?.displayName || users[id]?.name || id}
        />
      </span>
      <span className="min-w-0">
        <span className="block font-medium">
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
}

function CopySegment({
  segment,
  users,
}: {
  segment: CopyTreeSegment;
  users: Record<string, RobloxUser>;
}) {
  if (segment.attached === "root" && segment.hops.length > 1) {
    return (
      <CopySegment
        users={users}
        segment={{
          attached: "root",
          hops: segment.hops.slice(0, 1),
          split: false,
          holder: null,
          children: [
            { ...segment, attached: "direct", hops: segment.hops.slice(1) },
          ],
        }}
      />
    );
  }

  const endpoint = segment.hops.at(-1);
  const isRoot = segment.attached === "root";
  const isCopy = !isRoot && !segment.split && segment.holder !== null;
  const shownId = isCopy ? segment.holder!.user_id : endpoint?.user_id;
  const previousOwners = segment.hops.slice(
    0,
    isCopy && shownId !== endpoint?.user_id ? undefined : -1,
  );
  const directCopies = segment.split
    ? segment.children.filter(
        (child) =>
          child.attached === "direct" &&
          child.holder &&
          !child.split &&
          child.children.length === 0,
      )
    : [];
  const branches = segment.children.filter(
    (child) => !directCopies.includes(child),
  );
  const retainedCopy = segment.holder && !isCopy;
  const copyCount = directCopies.length + (retainedCopy ? 1 : 0);
  const now = Math.floor(Date.now() / 1000);
  const lastSeen = segment.holder?.last_seen;
  const recentIndicator = typeof lastSeen === "number" &&
    lastSeen <= now &&
    lastSeen >= now - 30 * 24 * 60 * 60 && (
      <span
        role="img"
        aria-label="Seen in the last 30 days"
        title="Seen in the last 30 days"
        className="bg-status-success inline-block size-2 shrink-0 rounded-full"
      />
    );

  return (
    <li
      className={
        isRoot
          ? "min-w-0"
          : `before:border-border-card after:border-border-card relative min-w-0 pb-3 pl-3 before:absolute before:top-8 before:left-0 before:w-3 before:border-t-2 after:absolute after:inset-y-0 after:left-0 after:border-l-2 last:pb-0 last:after:bottom-auto last:after:h-8 sm:pl-5 sm:before:w-5 ${segment.attached === "gap" ? "before:border-dashed after:border-dashed" : "before:border-solid after:border-solid"}`
      }
    >
      {segment.attached === "gap" && (
        <div className="text-secondary-text mb-2 text-xs">
          <p className="font-semibold">Earlier trades not recorded</p>
          <p>
            This branch connects somewhere later in the history above, not at
            the point shown.
          </p>
        </div>
      )}
      <div
        className={`rounded-lg border p-3 ${isRoot ? "border-border-focus bg-secondary-bg" : isCopy ? "border-border-card border-l-status-warning bg-tertiary-bg border-l-2" : "border-border-card bg-secondary-bg"}`}
      >
        {isRoot && (
          <p className="text-primary-text mb-2 text-xs font-semibold">
            Original owner
          </p>
        )}
        {segment.split && (
          <p className="text-status-warning mb-2 text-xs font-semibold">
            Dupe point
          </p>
        )}
        {shownId && (
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm">
            <OwnerIdentity id={shownId} users={users} nested={isCopy} />
            <div
              className={`text-secondary-text text-xs sm:text-right ${isCopy ? "w-full sm:w-auto" : ""}`}
            >
              <p className="inline-flex items-center gap-1.5">
                {isCopy && recentIndicator}
                {isCopy
                  ? "Last seen"
                  : isRoot
                    ? "Original owner since"
                    : "History date"}
              </p>
              <p>
                {isCopy
                  ? segment.holder!.last_seen === null
                    ? "Date unavailable"
                    : formatShortDateTime(segment.holder!.last_seen)
                  : endpoint
                    ? formatShortDateTime(endpoint.trade_time)
                    : "Date unavailable"}
              </p>
            </div>
          </div>
        )}
        {previousOwners.length > 0 && (
          <details className="text-secondary-text mt-2 text-xs">
            <summary className="cursor-pointer py-1">
              Show {previousOwners.length}{" "}
              {previousOwners.length === 1
                ? "previous owner"
                : "previous owners"}
            </summary>
            <ol className="border-border-card mt-2 space-y-2 border-t pt-2">
              {previousOwners.map((entry, index) => (
                <li
                  key={index}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm"
                >
                  <OwnerIdentity
                    id={entry.user_id}
                    users={users}
                    nested={isCopy}
                  />
                  <span className="text-secondary-text text-xs">
                    {formatShortDateTime(entry.trade_time)}
                  </span>
                </li>
              ))}
            </ol>
          </details>
        )}
        {retainedCopy && (
          <div className="border-border-card text-secondary-text mt-2 border-t pt-2 text-xs">
            {segment.holder!.user_id !== shownId && (
              <OwnerIdentity id={segment.holder!.user_id} users={users} />
            )}
            <p className="mt-1">
              Last recorded holder ·{" "}
              {segment.split ? "kept a copy here" : "recorded copy"}
            </p>
            <p className="flex items-center gap-1.5">
              {recentIndicator}
              Last seen{" "}
              {segment.holder!.last_seen === null
                ? "date unavailable"
                : formatShortDateTime(segment.holder!.last_seen)}
            </p>
          </div>
        )}
        {copyCount > 0 && segment.split && (
          <p className="text-secondary-text mt-3 text-xs">
            {copyCount} recorded {copyCount === 1 ? "copy" : "copies"} from this
            dupe point
          </p>
        )}
        {directCopies.length > 0 && (
          <ul className="mt-2" aria-label="Copies from this dupe point">
            {directCopies.map((child, index) => (
              <CopySegment key={index} segment={child} users={users} />
            ))}
          </ul>
        )}
      </div>
      {branches.length > 0 && (
        <ul className="pt-3" aria-label="Dupe branches">
          {branches.map((child, index) => (
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
        <p className="text-secondary-text mt-1 flex items-center gap-1.5 text-sm">
          <span
            aria-hidden="true"
            className="bg-status-success size-2 shrink-0 rounded-full"
          />
          Seen in the last 30 days.
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
