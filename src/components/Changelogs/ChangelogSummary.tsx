import React, { useState, useEffect, useCallback } from "react";
import { Icon } from "../ui/IconWrapper";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { Spinner } from "../ui/Spinner";
import { RateLimitBanner } from "../ui/RateLimitBanner";
import { isFeatureEnabled } from "@/utils/api/featureFlags";
import { useAuthContext } from "@/contexts/AuthContext";
import { PUBLIC_API_URL } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { trackEvent } from "@/utils/analytics/rybbit";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChangelogSummaryProps {
  changelogId: number;
  content: string;
}

function MarkdownBody({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h2: ({ children }) => (
          <h2 className="text-primary-text mt-4 mb-2 text-base font-semibold first:mt-0">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-primary-text mt-3 mb-1 text-sm font-semibold first:mt-0">
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p className="text-secondary-text mb-2 text-sm">{children}</p>
        ),
        strong: ({ children }) => (
          <strong className="text-primary-text font-semibold">
            {children}
          </strong>
        ),
        ul: ({ children }) => (
          <ul className="text-secondary-text mb-2 space-y-1 text-sm">
            {children}
          </ul>
        ),
        li: ({ children }) => (
          <li className="flex items-start gap-2">
            <span className="text-link mt-1 shrink-0">•</span>
            <span>{children}</span>
          </li>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
}

export default function ChangelogSummary({
  changelogId,
  content,
}: ChangelogSummaryProps) {
  const { setLoginModal } = useAuthContext();
  const [streamedText, setStreamedText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [hasGenerated, setHasGenerated] = useState(false);
  const [rateLimitUntil, setRateLimitUntil] = useState<number | null>(null);

  useEffect(() => {
    if (!rateLimitUntil) return;
    const ms = rateLimitUntil - Date.now();
    if (ms <= 0) {
      setRateLimitUntil(null);
      return;
    }
    const id = setTimeout(() => setRateLimitUntil(null), ms);
    return () => clearTimeout(id);
  }, [rateLimitUntil]);

  const generateSummary = useCallback(async () => {
    if (loading) return;

    setLoading(true);
    setError("");
    setStreamedText("");

    try {
      if (!PUBLIC_API_URL) throw new Error("Missing PUBLIC_API_URL");

      const { url, headers } = buildApiFetchRequest(
        PUBLIC_API_URL,
        `/changelogs/${changelogId}/summary`,
      );

      const response = await fetch(url, { credentials: "include", headers });

      if (!response.ok) {
        if (response.status === 401) {
          toast.info(
            "You must be logged in to generate AI summaries. Please log in and try again.",
          );
          setLoginModal({ open: true });
          return;
        }
        if (response.status === 429) {
          const retryAfterHeader = response.headers.get("retry-after");
          const retryAfterSeconds = retryAfterHeader
            ? parseInt(retryAfterHeader, 10)
            : null;
          if (retryAfterSeconds) {
            setRateLimitUntil(Date.now() + retryAfterSeconds * 1000);
          }
          const hours = retryAfterSeconds
            ? Math.ceil(retryAfterSeconds / 3600)
            : null;
          toast.error(
            hours
              ? `AI Summary rate limit exceeded. Please try again in ${hours} hour${hours !== 1 ? "s" : ""}.`
              : "AI Summary rate limit exceeded. Please try again later.",
            { duration: 8000 },
          );
          return;
        }
        throw new Error(`Request failed: ${response.status}`);
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setStreamedText(
          (prev) => prev + decoder.decode(value, { stream: true }),
        );
      }

      setHasGenerated(true);
      trackEvent("Changelog Summary Generated", { changelog_id: changelogId });
    } catch (err) {
      console.error("Failed to generate summary:", err);
      toast.error("Failed to generate AI summary. Please try again.", {
        duration: 4000,
      });
      setError(
        err instanceof Error ? err.message : "Failed to generate summary",
      );
    } finally {
      setLoading(false);
    }
  }, [changelogId, loading, setLoginModal]);

  useEffect(() => {
    setStreamedText("");
    setError("");
    setHasGenerated(false);
  }, [changelogId]);

  if (!isFeatureEnabled("AI_SUMMARY")) return null;

  if (content.length <= 300) {
    return (
      <div className="border-border-card bg-secondary-bg mb-6 rounded-lg border p-4">
        <div className="flex items-center gap-2">
          <Icon icon="solar:magic-stick-3-bold" className="text-link h-5 w-5" />
          <span className="text-primary-text font-medium">AI Summary</span>
        </div>
        <p className="text-primary-text mt-2 text-sm">
          AI summaries are not available for short changelogs. This changelog is
          too brief to generate a meaningful summary.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="border-border-card bg-secondary-bg mb-6 rounded-lg border p-4">
        <div className="mb-2 flex items-center gap-2">
          <Icon
            icon="solar:magic-stick-3-bold"
            className="text-link h-5 w-5 animate-pulse"
          />
          <span className="text-primary-text font-medium">
            Generating AI Summary
          </span>
        </div>
        {streamedText ? (
          <div
            className="max-h-80 overflow-y-auto pr-2"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "var(--color-border-primary) transparent",
            }}
          >
            <MarkdownBody>{streamedText}</MarkdownBody>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Spinner className="h-4 w-4" />
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-border-card bg-secondary-bg mb-6 rounded-lg border p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon
              icon="solar:danger-triangle-bold"
              className="h-5 w-5 text-red-500"
            />
            <span className="text-primary-text font-medium">
              AI Summary Error
            </span>
          </div>
          <Button size="sm" onClick={generateSummary}>
            Retry
          </Button>
        </div>
        <p className="text-primary-text text-sm">{error}</p>
      </div>
    );
  }

  if (hasGenerated && streamedText) {
    return (
      <div className="border-border-card bg-secondary-bg mb-6 rounded-lg border p-4">
        <div className="mb-3 flex items-center gap-2">
          <Icon icon="solar:magic-stick-3-bold" className="text-link h-5 w-5" />
          <span className="text-primary-text font-medium">AI Summary</span>
        </div>
        <div
          className="max-h-80 overflow-y-auto pr-2"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "var(--color-border-primary) transparent",
          }}
        >
          <MarkdownBody>{streamedText}</MarkdownBody>
        </div>
      </div>
    );
  }

  return (
    <div className="border-border-card bg-secondary-bg mb-6 rounded-lg border p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Icon icon="solar:magic-stick-3-bold" className="text-link h-5 w-5" />
          <span className="text-primary-text font-medium">AI Summary</span>
        </div>
        <Button
          onClick={generateSummary}
          disabled={!!rateLimitUntil}
          className="w-full sm:w-auto"
        >
          <Icon icon="solar:magic-stick-3-bold" className="h-4 w-4" />
          Generate Summary
        </Button>
      </div>
      <RateLimitBanner
        until={rateLimitUntil}
        label="AI Summary rate limit exceeded."
        className="mt-3"
      />
    </div>
  );
}
