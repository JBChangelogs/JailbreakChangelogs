import React from "react";

function CommentSkeletonItem() {
  return (
    <div className="flex gap-2 sm:gap-3">
      <div className="flex w-10 shrink-0 items-start pt-1.5">
        <div className="bg-tertiary-bg h-10 w-10 rounded-full" />
      </div>
      <div className="min-w-0 flex-1 pt-1.5 pb-2">
        <div className="mb-2 flex items-center gap-2">
          <div className="bg-tertiary-bg h-4 w-24 rounded" />
          <div className="bg-tertiary-bg h-3 w-14 rounded" />
        </div>
        <div className="space-y-2">
          <div className="bg-tertiary-bg h-3.5 w-full rounded" />
          <div className="bg-tertiary-bg h-3.5 w-4/5 rounded" />
          <div className="bg-tertiary-bg h-3.5 w-2/3 rounded" />
        </div>
      </div>
    </div>
  );
}

export function CommentSkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="flex animate-pulse flex-col space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <CommentSkeletonItem key={i} />
      ))}
    </div>
  );
}
