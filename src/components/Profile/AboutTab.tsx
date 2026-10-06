"use client";

import { createLogger } from "@/services/logger";
import { useState, useEffect } from "react";

const log = createLogger("UI");
import { Button } from "@/components/ui/button";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Icon } from "../ui/IconWrapper";
import { formatCustomDate } from "@/utils/helpers/timestamp";
import { useRealTimeRelativeDate } from "@/hooks/useRealTimeRelativeDate";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/AuthContext";
import { convertUrlsToLinks } from "@/utils/ui/urlConverter";
import { sanitizeText } from "@/utils/ui/sanitizeText";
import { PUBLIC_API_URL } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";

interface AboutTabProps {
  user: {
    id: string;
    username: string;
    bio?: string;
    bio_last_updated?: number;
  };
  currentUserId: string | null;
  bio?: string | null;
  bioLastUpdated?: number | null;
  onBioUpdate?: (newBio: string) => void;
}

const MAX_BIO_LENGTH = 512;

const cleanBioText = (text: string): string => {
  return sanitizeText(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n\n+/g, "\n\n"); // Collapse multiple consecutive newlines to just two
};

export default function AboutTab({
  user,
  currentUserId,
  bio,
  bioLastUpdated,
  onBioUpdate,
}: AboutTabProps) {
  // Read more functionality
  const MAX_VISIBLE_LINES = 5;
  const [bioExpanded, setBioExpanded] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [newBio, setNewBio] = useState("");
  const [isSavingBio, setIsSavingBio] = useState(false);
  const realTimeRelativeDate = useRealTimeRelativeDate(bioLastUpdated);
  const { isAuthenticated } = useAuthContext();

  useEffect(() => {
    if (!isEditingBio) {
      setNewBio(sanitizeText(bio || ""));
      setBioExpanded(false);
    }
  }, [bio, isEditingBio]);

  const handleSaveBio = async () => {
    if (!isAuthenticated) {
      toast.info("You need to be logged in to update your bio");
      return;
    }

    const cleanedBio = cleanBioText(newBio);
    if (cleanedBio.length > MAX_BIO_LENGTH) {
      toast.error(`Bio cannot exceed ${MAX_BIO_LENGTH} characters`);
      return;
    }

    // Check if bio hasn't changed
    const originalBio = cleanBioText(bio || "");
    if (cleanedBio === originalBio) {
      setIsEditingBio(false);
      return;
    }

    setIsSavingBio(true);
    try {
      const { url, headers } = buildApiFetchRequest(
        PUBLIC_API_URL,
        "/v2/users/me/description",
      );
      const response = await fetch(url, {
        method: "PUT",
        credentials: "include",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ description: cleanedBio }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        log.error("update bio failed", { status: response.status, body });
        throw new Error("Failed to update bio");
      }

      // Update parent component with new bio directly
      if (onBioUpdate) {
        onBioUpdate(cleanedBio);
      }

      toast.success("Bio updated successfully");
      setIsEditingBio(false);
    } catch (error) {
      log.error("Error updating bio", error);
      toast.error("Failed to update bio");
    } finally {
      setIsSavingBio(false);
    }
  };

  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewBio(e.target.value);
  };

  return (
    <div className="space-y-6">
      {/* About Me Section */}
      <div className="border-border-card bg-secondary-bg rounded-2xl border p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-primary-text text-lg font-semibold">About Me</h2>
          {currentUserId === user.id && !isEditingBio && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={() => setIsEditingBio(true)}
                  size="sm"
                  className="h-8 w-8 rounded-lg p-1"
                  aria-label="Edit bio"
                >
                  <Icon icon="heroicons:pencil" className="text-link h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit bio</TooltipContent>
            </Tooltip>
          )}
        </div>

        {isEditingBio && currentUserId === user.id ? (
          <div className="space-y-3">
            <div className="relative">
              <textarea
                value={newBio}
                onChange={handleBioChange}
                placeholder="Write something about yourself..."
                className="border-border-card bg-tertiary-bg text-primary-text hover:border-border-focus focus:border-button-info min-h-30 w-full resize-y rounded border p-3 text-sm focus:outline-none"
                maxLength={MAX_BIO_LENGTH}
                style={{ wordWrap: "break-word", overflowWrap: "break-word" }}
              />
              <div
                className={`absolute right-2 bottom-2 text-xs ${newBio.length >= MAX_BIO_LENGTH ? "text-button-danger" : "text-secondary-text"}`}
              >
                {newBio.length}/{MAX_BIO_LENGTH}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsEditingBio(false);
                  setNewBio(sanitizeText(bio || ""));
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveBio}
                disabled={!newBio.trim() || isSavingBio}
              >
                {isSavingBio ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {bio ? (
              (() => {
                const displayBio = sanitizeText(bio);
                // Split bio into lines for truncation
                const lines = displayBio.split(/\r?\n/);
                const shouldTruncate = lines.length > MAX_VISIBLE_LINES;
                const visibleLines =
                  shouldTruncate && !bioExpanded
                    ? lines.slice(0, MAX_VISIBLE_LINES)
                    : lines;
                return (
                  <>
                    <p className="text-primary-text text-base leading-relaxed wrap-break-word whitespace-pre-wrap">
                      {convertUrlsToLinks(visibleLines.join("\n"))}
                    </p>
                    {shouldTruncate && (
                      <button
                        className="text-border-focus hover:text-button-info mt-2 flex items-center gap-1 text-sm font-medium transition-colors duration-200 hover:underline"
                        onClick={() => setBioExpanded((e) => !e)}
                      >
                        {bioExpanded ? (
                          <>
                            <Icon
                              icon="mdi:chevron-up"
                              className="h-4 w-4"
                              inline={true}
                            />
                            Show less
                          </>
                        ) : (
                          <>
                            <Icon
                              icon="mdi:chevron-down"
                              className="h-4 w-4"
                              inline={true}
                            />
                            Read more
                          </>
                        )}
                      </button>
                    )}
                  </>
                );
              })()
            ) : (
              <p className="text-primary-text italic">No bio yet</p>
            )}
            {bio?.trim() && bioLastUpdated && (
              <p className="text-secondary-text mt-4 text-xs">
                Last updated:{" "}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help">{realTimeRelativeDate}</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {formatCustomDate(bioLastUpdated)}
                  </TooltipContent>
                </Tooltip>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
