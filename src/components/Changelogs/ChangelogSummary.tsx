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
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChangelogSummaryProps {
  changelogId: number;
  content: string;
}

const markdownComponents: Components = {
  h2: ({ children }) => (
    <h2 className="text-primary-text mt-4 mb-1.5 text-sm font-semibold text-balance first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-primary-text mt-4 mb-1.5 text-sm font-semibold text-balance first:mt-0">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-secondary-text text-pretty [&:not(:last-child)]:mb-3">
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="text-primary-text font-semibold">{children}</strong>
  ),
  ul: ({ children }) => (
    <ul className="text-secondary-text marker:text-link my-2 list-disc space-y-1.5 pl-5 last:mb-0">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="text-secondary-text my-2 list-decimal space-y-1.5 pl-5 last:mb-0">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1 text-pretty">{children}</li>,
  a: ({ children, href }) => (
    <a
      href={href}
      className="text-link [overflow-wrap:anywhere] underline underline-offset-2"
    >
      {children}
    </a>
  ),
};

function MarkdownBody({ children }: { children: string }) {
  return (
    <div className="max-w-[70ch] text-sm leading-7 break-words">
      <ReactMarkdown
        components={markdownComponents}
        remarkPlugins={[remarkGfm]}
      >
        {children}
      </ReactMarkdown>
    </div>
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
        `/v2/changelogs/${changelogId}/summary`,
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
      <div className="border-border-card bg-secondary-bg mb-6 rounded-xl border px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon
            icon="solar:magic-stick-3-bold"
            aria-hidden="true"
            className="text-link h-4 w-4 shrink-0"
          />
          <span className="text-primary-text font-medium">AI Summary</span>
        </div>
        <p className="text-secondary-text mt-1 text-sm leading-6">
          This changelog is already brief enough to read at a glance.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className="border-border-card bg-secondary-bg mb-6 rounded-xl border px-4 py-3"
        aria-busy="true"
      >
        <div className="flex items-start gap-2.5" role="status">
          <Icon
            icon="solar:magic-stick-3-bold"
            aria-hidden="true"
            className="text-link mt-1 h-4 w-4 shrink-0 motion-safe:animate-pulse"
          />
          <div className="min-w-0">
            <span className="text-primary-text text-sm font-medium">
              Generating summary…
            </span>
            {!streamedText && (
              <p className="text-secondary-text mt-0.5 text-xs leading-5">
                Pulling together the key changes.
              </p>
            )}
          </div>
          <Spinner className="text-link ml-auto h-4 w-4 shrink-0 self-center" />
        </div>
        {streamedText && (
          <div className="mt-4">
            <MarkdownBody>{streamedText}</MarkdownBody>
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="border-border-card bg-secondary-bg mb-6 rounded-xl border p-4"
        role="alert"
      >
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Icon
              icon="solar:danger-triangle-bold"
              aria-hidden="true"
              className="text-status-error h-4 w-4 shrink-0"
            />
            <span className="text-primary-text font-medium">
              Couldn’t generate summary
            </span>
          </div>
          <Button variant="secondary" onClick={generateSummary}>
            Retry
          </Button>
        </div>
        <p className="text-secondary-text text-sm leading-6">
          Please try again in a moment.
        </p>
      </div>
    );
  }

  if (hasGenerated && streamedText) {
    return (
      <details
        key={changelogId}
        open
        className="group border-border-card bg-secondary-bg mb-6 rounded-xl border px-4 sm:px-5"
      >
        <summary className="focus-visible:ring-border-focus flex min-h-14 cursor-pointer list-none flex-wrap items-center justify-between gap-2 rounded-lg py-3 focus-visible:ring-2 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2">
            <Icon
              icon="solar:magic-stick-3-bold"
              aria-hidden="true"
              className="text-link h-4 w-4 shrink-0"
            />
            <span className="text-primary-text font-medium">AI Summary</span>
          </span>
          <span className="text-secondary-text flex items-center gap-1 text-xs">
            <span className="group-open:hidden">Expand</span>
            <span className="hidden group-open:inline">Collapse</span>
            <Icon
              icon="heroicons:chevron-down"
              aria-hidden="true"
              className="h-4 w-4 group-open:rotate-180"
            />
          </span>
        </summary>
        <div className="border-border-card border-t pt-4 pb-5">
          <MarkdownBody>{streamedText}</MarkdownBody>
          <p className="text-secondary-text mt-4 text-xs leading-5">
            AI-generated summary · May miss details
          </p>
        </div>
      </details>
    );
  }

  return (
    <div className="border-border-card bg-secondary-bg @container mb-6 rounded-xl border px-4 py-3">
      <div className="flex flex-col gap-3 @sm:flex-row @sm:items-center @sm:justify-between">
        <div className="flex min-w-0 items-start gap-2.5">
          <Icon
            icon="solar:magic-stick-3-bold"
            aria-hidden="true"
            className="text-link mt-1 h-4 w-4 shrink-0"
          />
          <div className="min-w-0">
            <span className="text-primary-text text-sm font-medium">
              AI Summary
            </span>
            <p className="text-secondary-text mt-0.5 text-xs leading-5">
              Get the key changes at a glance.
            </p>
          </div>
        </div>
        <Button
          onClick={generateSummary}
          disabled={!!rateLimitUntil}
          variant="secondary"
          className="w-full @sm:w-auto pointer-coarse:min-h-11"
        >
          Summarize
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
