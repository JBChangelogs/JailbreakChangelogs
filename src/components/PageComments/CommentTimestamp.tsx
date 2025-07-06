import React from 'react';
import { Tooltip } from '@mui/material';
import { formatCustomDate } from '@/utils/timestamp';
import { useOptimizedRealTimeRelativeDate } from '@/hooks/useSharedTimer';

interface CommentTimestampProps {
  date: string;
  editedAt?: string | null;
  commentId: number;
}

const CommentTimestamp: React.FC<CommentTimestampProps> = ({ date, editedAt, commentId }) => {
  // Use optimized real-time relative date for both posted and edited timestamps
  const postedRelativeTime = useOptimizedRealTimeRelativeDate(
    parseInt(date),
    `comment-posted-${commentId}`
  );

  const editedRelativeTime = useOptimizedRealTimeRelativeDate(
    editedAt ? parseInt(editedAt) : null,
    `comment-edited-${commentId}`
  );

  const displayTimestamp = editedAt ? editedAt : date;
  const displayRelativeTime = editedAt ? editedRelativeTime : postedRelativeTime;
  const displayText = editedAt ? `edited ${displayRelativeTime}` : `posted ${displayRelativeTime}`;

  return (
    <Tooltip 
      title={formatCustomDate(parseInt(displayTimestamp))}
      placement="top"
      arrow
      slotProps={{
        tooltip: {
          sx: {
            backgroundColor: '#0F1419',
            color: '#D3D9D4',
            fontSize: '0.75rem',
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #2E3944',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            '& .MuiTooltip-arrow': {
              color: '#0F1419',
            }
          }
        }
      }}
    >
      <span className="text-xs text-[#748D92] mt-0.5 cursor-help">
        {displayText}
      </span>
    </Tooltip>
  );
};

export default CommentTimestamp; 