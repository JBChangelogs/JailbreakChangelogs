"use client";

import { sanitizeText } from "@/utils/ui/sanitizeText";
import { toast } from "sonner";
import DOMPurify from "dompurify";
import type { CommentData } from "@/utils/api/api";
import type { CommentApiErrorData } from "./commentTypes";

/**
 * Checks if a comment is still within its 1-hour edit window.
 * @param commentDate Unix timestamp as a string
 */
export const isCommentEditable = (commentDate: string): boolean => {
  const commentTime = parseInt(commentDate);
  const currentTime = Math.floor(Date.now() / 1000);
  const oneHourInSeconds = 3600;
  return currentTime - commentTime <= oneHourInSeconds;
};

/**
 * Cleans up comment text by removing excess whitespace and empty lines.
 */
export const cleanCommentText = (text: string): string => {
  return sanitizeText(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");
};

/**
 * Wraps @mentions in <span> tags for styling.
 */
export const processMentions = (text: string): string => {
  return text.replace(/@(\w+)/g, (_, username) => {
    return `<span>@${username}</span>`;
  });
};

/**
 * Escapes HTML characters to prevent XSS.
 */
export const escapeHtml = (text: string): string => {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
};

/**
 * Identifies URLs in text and converts them to safe <a> tags
 * if they belong to whitelisted domains.
 */
export const convertUrlsToLinksHTML = (text: string): string => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, (url) => {
    try {
      const urlObj = new URL(url);
      if (
        // Whitelist of safe domains for linking
        urlObj.hostname === "roblox.com" ||
        urlObj.hostname.endsWith(".roblox.com") ||
        urlObj.hostname === "reddit.com" ||
        urlObj.hostname.endsWith(".reddit.com") ||
        urlObj.hostname === "amazon.com" ||
        urlObj.hostname.endsWith(".amazon.com") ||
        urlObj.hostname === "jailbreakchangelogs.com" ||
        urlObj.hostname.endsWith(".jailbreakchangelogs.com")
      ) {
        // Escape the URL to prevent attribute injection
        const escapedUrl = escapeHtml(url);
        return `<a href="${escapedUrl}" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover active:text-link-active transition-colors duration-200 hover:underline">${escapedUrl}</a>`;
      }
      return url;
    } catch {
      return url;
    }
  });
};

/**
 * Sanitizes HTML content using DOMPurify with a strict whitelist.
 * Run only on the client side.
 */
export const sanitizeHTML = (html: string): string => {
  if (typeof window === "undefined") return html;

  // Handle both default and named exports for cross-environment compatibility
  const purify =
    (DOMPurify as unknown as { default?: typeof DOMPurify }).default ||
    DOMPurify;

  if (typeof purify.sanitize !== "function") {
    // SECURITY: If sanitizer is missing, redact the content rather than showing potentially unsafe HTML
    return "<i>[Content Redacted]</i>";
  }

  return purify.sanitize(html, {
    ALLOWED_TAGS: ["br", "b", "strong", "i", "u"],
    ALLOWED_ATTR: [],
  });
};

export const normalizeEditedCommentPayload = (
  payload: unknown,
): Partial<CommentData> | null => {
  if (!payload || typeof payload !== "object") return null;

  const typedPayload = payload as Record<string, unknown>;
  const candidate =
    (typedPayload.comment as Record<string, unknown> | undefined) ||
    (typedPayload.data as Record<string, unknown> | undefined) ||
    typedPayload;

  if (!candidate || typeof candidate !== "object") return null;

  const normalized: Partial<CommentData> = {};

  if (typeof candidate.content === "string") {
    normalized.content = candidate.content;
  }
  if (
    candidate.edited_at === null ||
    candidate.edited_at === undefined ||
    typeof candidate.edited_at === "string" ||
    typeof candidate.edited_at === "number"
  ) {
    normalized.edited_at =
      typeof candidate.edited_at === "number"
        ? candidate.edited_at.toString()
        : (candidate.edited_at as CommentData["edited_at"]);
  }
  if (typeof candidate.date === "string") {
    normalized.date = candidate.date;
  }
  if (typeof candidate.author === "string") {
    normalized.author = candidate.author;
  }
  if (typeof candidate.user_id === "string") {
    normalized.user_id = candidate.user_id;
  }

  return Object.keys(normalized).length > 0 ? normalized : null;
};

export const formatErrorTitle = (error?: string) => {
  if (!error) return "Error";
  return error.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

export const handleCommentApiError = (
  data: CommentApiErrorData | null | undefined,
  defaultMessage: string,
) => {
  if (data?.error === "profanity_detected") {
    const flagged = data.flagged || [];
    const message =
      data.message || "Please remove profanity from your comment.";
    toast.error(formatErrorTitle(data.error), {
      description: (
        <span>
          {message}
          {flagged.length > 0 && (
            <>
              <br />
              Flagged: {flagged.map((f) => f.word).join(", ")}
            </>
          )}
        </span>
      ),
    });
    return true;
  }

  if (data?.error === "invalid_token") {
    toast.error("Session Expired", {
      description: data.message || "Please log in again to post a comment.",
    });
    return true;
  }

  if (data?.error === "parent_not_found" || data?.error === "invalid_parent") {
    toast.error("Reply Error", {
      description:
        data.message ||
        "The comment you are replying to no longer exists or is invalid.",
    });
    return true;
  }

  // Handle any error with a message, or internal_server_error
  if (data?.message || data?.error === "internal_server_error") {
    const errorTitle =
      data?.error === "internal_server_error"
        ? "Server Error"
        : formatErrorTitle(data?.error);
    toast.error(errorTitle, {
      description: data.message || defaultMessage,
    });
    return true;
  }

  // If we have an error but no message, show the error code
  if (data?.error) {
    const errorTitle = formatErrorTitle(data.error);
    toast.error(errorTitle, {
      description: defaultMessage,
    });
    return true;
  }

  return false;
};
