"use client";

import { createContext, useContext } from "react";
import type { useCommentState } from "./useCommentState";

export type CommentsContextValue = ReturnType<typeof useCommentState>;

export const CommentsContext = createContext<CommentsContextValue | null>(null);

export function useCommentsContext(): CommentsContextValue {
  const ctx = useContext(CommentsContext);
  if (!ctx) {
    throw new Error(
      "useCommentsContext must be used within CommentsContext.Provider",
    );
  }
  return ctx;
}
