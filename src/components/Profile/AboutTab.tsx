"use client";

import { useState, useEffect } from "react";
import { Button } from "@mui/material";
import dynamic from "next/dynamic";

const Tooltip = dynamic(() => import("@mui/material/Tooltip"), {
  ssr: false,
});
import { Icon } from "../ui/IconWrapper";
import { formatCustomDate } from "@/utils/timestamp";
import { useRealTimeRelativeDate } from "@/hooks/useRealTimeRelativeDate";
import { toast } from "react-hot-toast";
import { useAuthContext } from "@/contexts/AuthContext";
import { convertUrlsToLinks } from "@/utils/urlConverter";

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
  return text
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
  const [localBioLastUpdated, setLocalBioLastUpdated] = useState<number | null>(
    bioLastUpdated || null,
  );

  // Use real-time relative date
  const realTimeRelativeDate = useRealTimeRelativeDate(localBioLastUpdated);
  const { isAuthenticated } = useAuthContext();

  useEffect(() => {
    // Initialize bio from props
    setNewBio(bio || "");
    setLocalBioLastUpdated(bioLastUpdated || null);
    setBioExpanded(false);
  }, [bio, bioLastUpdated]);

  const handleSaveBio = async () => {
    if (!isAuthenticated) {
      toast.error("You need to be logged in to update your bio");
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
      const response = await fetch(`/api/users/description/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: cleanedBio }),
      });

      if (!response.ok) {
        throw new Error("Failed to update bio");
      }

      await response.json();

      // Update parent component with new bio directly
      if (onBioUpdate) {
        onBioUpdate(cleanedBio);
      }

      // Update local timestamp immediately for real-time display
      setLocalBioLastUpdated(Date.now());

      toast.success("Bio updated successfully");
      setIsEditingBio(false);
    } catch (error) {
      console.error("Error updating bio:", error);
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
      <div className="border-border-primary rounded-lg border p-4">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-primary-text text-lg font-semibold">About Me</h2>
          {currentUserId === user.id && !isEditingBio && (
            <Tooltip
              title="Edit bio"
              placement="top"
              arrow
              slotProps={{
                tooltip: {
                  sx: {
                    backgroundColor: "var(--color-primary-bg)",
                    color: "var(--color-secondary-text)",
                    fontSize: "0.75rem",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px var(--color-card-shadow)",
                    "& .MuiTooltip-arrow": {
                      color: "var(--color-primary-bg)",
                    },
                  },
                },
              }}
            >
              <Button
                variant="text"
                onClick={() => setIsEditingBio(true)}
                sx={{
                  color: "var(--color-button-info)",
                  minWidth: "auto",
                  padding: "4px",
                }}
              >
                <Icon
                  icon="heroicons:pencil"
                  className="text-button-info h-5 w-5"
                />
              </Button>
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
                className="border-border-primary bg-form-input text-primary-text hover:border-border-focus focus:border-button-info min-h-[120px] w-full resize-y rounded border p-3 text-sm focus:outline-none"
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
                size="small"
                variant="outlined"
                onClick={() => {
                  setIsEditingBio(false);
                  setNewBio(bio || "");
                }}
                className="text-secondary-text hover:text-primary-text rounded-md border-none bg-transparent text-sm normal-case"
              >
                Cancel
              </Button>
              <Button
                size="small"
                variant="contained"
                onClick={handleSaveBio}
                disabled={!newBio.trim() || isSavingBio}
                className="bg-button-info text-form-button-text hover:bg-button-info-hover rounded-md text-sm normal-case"
              >
                {isSavingBio ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {bio ? (
              (() => {
                // Split bio into lines for truncation
                const lines = bio.split(/\r?\n/);
                const shouldTruncate = lines.length > MAX_VISIBLE_LINES;
                const visibleLines =
                  shouldTruncate && !bioExpanded
                    ? lines.slice(0, MAX_VISIBLE_LINES)
                    : lines;
                return (
                  <>
                    <p className="text-primary-text break-words whitespace-pre-wrap">
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
            {localBioLastUpdated && (
              <p className="text-secondary-text mt-2 text-xs">
                Last updated:{" "}
                <Tooltip
                  title={formatCustomDate(localBioLastUpdated)}
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
                        boxShadow: "0 4px 12px var(--color-card-shadow)",
                        "& .MuiTooltip-arrow": {
                          color: "var(--color-secondary-bg)",
                        },
                      },
                    },
                  }}
                >
                  <span className="cursor-help">{realTimeRelativeDate}</span>
                </Tooltip>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
