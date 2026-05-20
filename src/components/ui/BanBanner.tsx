"use client";

import { cn } from "@/lib/utils";
import { formatFullDate } from "@/utils/helpers/timestamp";
import type { BanInfo } from "@/utils/api/ban";

interface BanBannerProps {
  ban: BanInfo;
  className?: string;
}

export function BanBanner({ ban, className }: BanBannerProps) {
  const feature = ban.banType ? ban.banType.replace(/_/g, " ") : "this feature";
  const expires = ban.expiresAt ? formatFullDate(ban.expiresAt) : "Permanent";

  return (
    <div
      className={cn(
        "text-primary-text flex items-start gap-2.5 rounded-lg border border-button-danger/30 bg-button-danger/10 px-3 py-2.5 text-sm",
        className,
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="text-primary-text mt-0.5 h-4 w-4 shrink-0"
        viewBox="0 0 24 24"
      >
        <path d="M0 0h24v24H0z" fill="none" />
        <path
          fill="currentColor"
          fillRule="evenodd"
          d="m13.766 13.08l2.91 2.91a1.8 1.8 0 0 0 2.547 0l2.404-2.404a1.8 1.8 0 0 0 0-2.545L17.95 7.364a1 1 0 1 0 1.414-1.414L17.95 4.536a1 1 0 0 0-1.415 1.413l-3.677-3.676a1.8 1.8 0 0 0-2.545 0L7.909 4.677a1.8 1.8 0 0 0 0 2.546l2.91 2.91l-8.65 7.359l-.059.054a2.6 2.6 0 0 0 0 3.677l.566.566a2.6 2.6 0 0 0 3.732-.06zm-1.418-1.419l-.11-.11l-8.735 7.432a.6.6 0 0 0 .022.826l.565.566a.6.6 0 0 0 .827.02z"
          clipRule="evenodd"
        />
      </svg>
      <div className="flex flex-col gap-0.5">
        <span className="font-medium">
          You have been banned{feature ? ` (${feature})` : ""}
        </span>
        <span className="text-secondary-text text-xs">
          Reason: {ban.reason}
        </span>
        <span className="text-secondary-text text-xs">
          {ban.expiresAt ? `Expires: ${expires}` : "This ban is permanent."}
        </span>
      </div>
    </div>
  );
}
