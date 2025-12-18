import React, { useState, useEffect, useCallback } from "react";
import { Icon } from "../ui/IconWrapper";
import { cleanMarkdown } from "@/utils/changelogs";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { isFeatureEnabled } from "@/utils/featureFlags";

interface ChangelogSummaryProps {
  changelogId: number;
  title: string;
  content: string;
}

interface TagData {
  name: string;
  category: string;
  relevance: number;
  type: string;
}

export default function ChangelogSummary({
  changelogId,
  title,
  content,
}: ChangelogSummaryProps) {
  const [summary, setSummary] = useState<string>("");
  const [highlights, setHighlights] = useState<string[]>([]);
  const [whatsNew, setWhatsNew] = useState<string>("");
  const [tags, setTags] = useState<TagData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateSummary = useCallback(async () => {
    if (loading) return; // Prevent duplicate calls while loading

    setLoading(true);
    setError("");

    try {
      // Clean the content before sending to API
      const cleanedContent = cleanMarkdown(content);

      const response = await fetch("/api/gemini/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: cleanedContent, title, changelogId }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if it's a rate limit error
        if (response.status === 429 && data.rateLimitError) {
          // Parse the rate limit reset time from the error details
          try {
            const errorDetails = JSON.parse(data.errorDetails);
            const resetTimestamp =
              errorDetails.metadata?.headers?.["X-RateLimit-Reset"];

            if (resetTimestamp) {
              const resetDate = new Date(parseInt(resetTimestamp));
              const now = new Date();
              const timeUntilReset = Math.max(
                0,
                resetDate.getTime() - now.getTime(),
              );
              const hoursUntilReset = Math.ceil(
                timeUntilReset / (1000 * 60 * 60),
              );

              toast.error(
                `AI Summary rate limit exceeded. Please try again in ${hoursUntilReset} hour${hoursUntilReset !== 1 ? "s" : ""}.`,
                {
                  duration: 8000,
                  position: "bottom-right",
                },
              );
            } else {
              toast.error(
                "AI Summary rate limit exceeded. Please try again later.",
                {
                  duration: 6000,
                  position: "bottom-right",
                },
              );
            }
          } catch {
            toast.error(
              "AI Summary rate limit exceeded. Please try again later.",
              {
                duration: 6000,
                position: "bottom-right",
              },
            );
          }
          setError("Rate limit exceeded. Please try again later.");
          return;
        }

        throw new Error(data.error || "Failed to generate summary");
      }

      setSummary(data.summary);
      setHighlights(data.highlights || []);
      setWhatsNew(data.whatsNew || "");
      setTags(data.tags || []);
      setHasGenerated(true);
    } catch (error) {
      console.error("Failed to generate summary:", error);

      // For other errors, show a generic error toast
      toast.error("Failed to generate AI summary. Please try again.", {
        duration: 4000,
        position: "bottom-right",
      });
      setError(
        error instanceof Error ? error.message : "Failed to generate summary",
      );
    } finally {
      setLoading(false);
    }
  }, [content, title, changelogId, loading]);

  useEffect(() => {
    // Reset state when changelogId changes (navigation to different changelog)
    setSummary("");
    setHighlights([]);
    setWhatsNew("");
    setTags([]);
    setError("");
    setHasGenerated(false);
  }, [changelogId]);

  if (!isFeatureEnabled("AI_SUMMARY")) {
    return null;
  }

  // Show message for short content
  if (content.length <= 300) {
    return (
      <div className="border-border-focus bg-secondary-bg hover:border-border-focus hover:shadow-card-shadow mb-6 rounded-lg border p-4 transition-colors duration-200 hover:shadow-lg">
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

  // Show loading state
  if (loading) {
    return (
      <div className="border-border-focus bg-secondary-bg hover:border-border-focus hover:shadow-card-shadow mb-6 rounded-lg border p-4 transition-colors duration-200 hover:shadow-lg">
        <div className="mb-2 flex items-center gap-2">
          <Icon
            icon="solar:magic-stick-3-bold"
            className="text-link h-5 w-5 animate-pulse"
          />
          <span className="text-primary-text font-medium">
            Generating AI Summary
          </span>
        </div>
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-secondary-text text-sm"
        >
          Thinking...
        </motion.div>
      </div>
    );
  }

  // Show error state with retry button
  if (error) {
    return (
      <div className="border-border-focus bg-secondary-bg hover:border-border-focus hover:shadow-card-shadow mb-6 rounded-lg border p-4 transition-colors duration-200 hover:shadow-lg">
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
          <button
            onClick={generateSummary}
            className="bg-button-info text-form-button-text hover:bg-button-info-hover cursor-pointer rounded px-3 py-1 text-sm transition-colors"
          >
            Retry
          </button>
        </div>
        <p className="text-primary-text text-sm">{error}</p>
      </div>
    );
  }

  // Show generated summary
  if (hasGenerated && summary) {
    return (
      <div className="border-border-focus bg-secondary-bg hover:border-border-focus hover:shadow-card-shadow mb-6 rounded-lg border p-4 transition-colors duration-200 hover:shadow-lg">
        <div
          className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border-primary hover:scrollbar-thumb-border-focus max-h-80 overflow-y-auto pr-2"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "var(--color-border-primary) transparent",
          }}
        >
          <div className="mb-3 flex items-center gap-2">
            <Icon
              icon="solar:magic-stick-3-bold"
              className="text-link h-5 w-5"
            />
            <span className="text-primary-text font-medium">AI Summary</span>
          </div>

          <p className="text-secondary-text mb-3">{summary}</p>

          {highlights.length > 0 && (
            <div className="mb-3">
              <h4 className="text-primary-text mb-2 font-medium">
                Key Highlights:
              </h4>
              <ul className="text-secondary-text space-y-1">
                {highlights.map((highlight, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-link mt-1">•</span>
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {whatsNew && (
            <div className="mb-3">
              <h4 className="text-primary-text mb-2 font-medium">
                What&apos;s New:
              </h4>
              <p className="text-secondary-text">{whatsNew}</p>
            </div>
          )}

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="border-border text-primary-text hover:text-link flex cursor-pointer items-center gap-1 rounded-full border px-2 py-1 text-xs transition-colors"
                  title={`${tag.category} (${Math.round(tag.relevance * 100)}% relevant)`}
                >
                  <Icon icon="solar:tag-bold" className="h-3 w-3" />
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show generate button (default state)
  return (
    <div className="border-border-focus bg-secondary-bg hover:border-border-focus hover:shadow-card-shadow mb-6 rounded-lg border p-4 transition-colors duration-200 hover:shadow-lg">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Icon icon="solar:magic-stick-3-bold" className="text-link h-5 w-5" />
          <span className="text-primary-text font-medium">AI Summary</span>
        </div>
        <button
          onClick={generateSummary}
          className="bg-button-info text-form-button-text hover:bg-button-info-hover flex w-full cursor-pointer items-center justify-center gap-2 rounded px-4 py-2 transition-colors sm:w-auto"
        >
          <Icon icon="solar:magic-stick-3-bold" className="h-4 w-4" />
          Generate Summary
        </button>
      </div>
    </div>
  );
}
