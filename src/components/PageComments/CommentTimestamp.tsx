import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCustomDate } from "@/utils/timestamp";
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
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="text-secondary-text mt-0.5 cursor-help text-xs">
          {displayText}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {formatCustomDate(parseInt(displayTimestamp))}
      </TooltipContent>
    </Tooltip>
  );
};

export default CommentTimestamp;
