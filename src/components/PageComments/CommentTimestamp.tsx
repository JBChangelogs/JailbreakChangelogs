import React from "react";
import dynamic from "next/dynamic";

const Tooltip = dynamic(() => import("@mui/material/Tooltip"), { ssr: false });
import { formatCustomDate } from "@/utils/helpers/timestamp";
import { useOptimizedRealTimeRelativeDate } from "@/hooks/useSharedTimer";

interface CommentTimestampProps {
  date: string;
  editedAt?: string | null;
  commentId: number;
}

const CommentTimestamp: React.FC<CommentTimestampProps> = ({
  date,
  editedAt,
  commentId,
}) => {
  // Use optimized real-time relative date for both posted and edited timestamps
  const postedRelativeTime = useOptimizedRealTimeRelativeDate(
    parseInt(date),
    `comment-posted-${commentId}`,
  );

  const editedRelativeTime = useOptimizedRealTimeRelativeDate(
    editedAt ? parseInt(editedAt) : null,
    `comment-edited-${commentId}`,
  );

  const displayTimestamp = editedAt ? editedAt : date;
  const displayRelativeTime = editedAt
    ? editedRelativeTime
    : postedRelativeTime;
  const displayText = editedAt
    ? `edited ${displayRelativeTime}`
    : `posted ${displayRelativeTime}`;

  return (
    <Tooltip
      title={formatCustomDate(parseInt(displayTimestamp))}
      placement="top"
      arrow
      slotProps={{
        tooltip: {
          sx: {
            backgroundColor: "var(--color-secondary-bg)",
            color: "var(--color-primary-text)",
            fontSize: "0.75rem",
            padding: "8px 12px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
            "& .MuiTooltip-arrow": {
              color: "var(--color-secondary-bg)",
            },
          },
        },
      }}
    >
      <span className="mt-0.5 cursor-help text-xs text-[#748D92]">
        {displayText}
      </span>
    </Tooltip>
  );
};

export default CommentTimestamp;
