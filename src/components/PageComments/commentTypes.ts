import type { CommentData } from "@/utils/api/api";
import type { UserData } from "@/types/auth";

/**
 * Properties for the ChangelogComments component.
 */
export interface ChangelogCommentsProps {
  changelogId: number | string;
  changelogTitle: string;
  type:
    | "changelog"
    | "season"
    | "item"
    | "tradev2"
    | "inventory"
    | "vsuggestion";
  itemType?: string;
  trade?: {
    author: string;
  };
  inventory?: {
    owner: string;
  };
  suggestion?: {
    suggester: string;
    upvoterIds?: string[];
    downvoterIds?: string[];
  };
  initialComments?: CommentData[];
  initialUserMap?: Record<string, UserData>;
}

/**
 * Metadata for a comment that is part of a threaded conversation.
 */
export interface ThreadedComment extends CommentData {
  depth: number;
}

/**
 * Placeholder for "load more" functionality in deep threads.
 */
export interface MoreItem {
  id: string;
  isMore: true;
  parentId: number;
  count: number;
  depth: number;
}

/**
 * Handle Specialized Comment API Errors
 */
export interface CommentApiErrorData {
  error?: string;
  flagged?: { word: string; source: string }[];
  try_again?: number;
  message?: string;
  character_limit?: number;
  tier?: number;
  current_tier?: number;
  required_tier?: number;
  required_limit?: number;
  [key: string]: unknown;
}
