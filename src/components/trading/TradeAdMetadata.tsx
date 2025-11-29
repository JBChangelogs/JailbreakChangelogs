import React from "react";
import { useRealTimeRelativeDate } from "@/hooks/useRealTimeRelativeDate";
import dynamic from "next/dynamic";
import { formatCustomDate } from "@/utils/timestamp";

const Tooltip = dynamic(() => import("@mui/material/Tooltip"), {
  ssr: false,
});

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
        <Tooltip
          title={formatCustomDate(created_at)}
          placement="top"
          arrow
          slotProps={{
            tooltip: {
              sx: {
                backgroundColor: "var(--color-primary-bg)",
                color: "var(--color-secondary-text)",
                fontSize: "0.75rem",
                padding: "8px 12px",
                borderRadius: "8px",
                boxShadow: "0 4px 12px var(--color-card-shadow)",
                "& .MuiTooltip-arrow": {
                  color: "var(--color-primary-bg)",
                },
              },
            },
          }}
        >
          <span className="cursor-help">Created {createdRelative}</span>
        </Tooltip>
        {expires && (
          <>
            <span>•</span>
            <Tooltip
              title={formatCustomDate(expires)}
              placement="top"
              arrow
              slotProps={{
                tooltip: {
                  sx: {
                    backgroundColor: "var(--color-primary-bg)",
                    color: "var(--color-secondary-text)",
                    fontSize: "0.75rem",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px var(--color-card-shadow)",
                    "& .MuiTooltip-arrow": {
                      color: "var(--color-primary-bg)",
                    },
                  },
                },
              }}
            >
              <span className="cursor-help">Expires {expiresRelative}</span>
            </Tooltip>
          </>
        )}
      </div>
    </div>
  );
}
