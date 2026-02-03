import React from "react";
import { useRealTimeRelativeDate } from "@/hooks/useRealTimeRelativeDate";
import { formatCustomDate } from "@/utils/timestamp";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TradeAdMetadataProps {
  status: string;
  created_at: number;
  expires?: number;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Pending":
      return "bg-button-info/10 text-primary-text border-button-info/20";
    case "Completed":
      return "bg-status-success/10 text-primary-text border-status-success/20";
    case "Expired":
      return "bg-status-error/10 text-status-error border-status-error/20";
    default:
      return "bg-secondary-text/10 text-secondary-text border-secondary-text/20";
  }
};

export default function TradeAdMetadata({
  status,
  created_at,
  expires,
}: TradeAdMetadataProps) {
  const createdRelative = useRealTimeRelativeDate(created_at);
  const expiresRelative = useRealTimeRelativeDate(expires);
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <span
        className={`rounded-full border px-3 py-1 text-sm font-medium ${getStatusColor(status)}`}
        aria-label={`Trade status: ${status}`}
      >
        {status}
      </span>
      <div className="text-secondary-text flex items-center gap-2 text-sm">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-help">Created {createdRelative}</span>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="bg-primary-bg text-secondary-text border-none shadow-[var(--color-card-shadow)]"
          >
            <p>{formatCustomDate(created_at)}</p>
          </TooltipContent>
        </Tooltip>
        {expires && (
          <>
            <span>•</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help">Expires {expiresRelative}</span>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="bg-primary-bg text-secondary-text border-none shadow-[var(--color-card-shadow)]"
              >
                <p>{formatCustomDate(expires)}</p>
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </div>
  );
}
