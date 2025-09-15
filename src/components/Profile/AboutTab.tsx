"use client";

import { useState, useEffect } from "react";
import { Button } from "@mui/material";
import { Tooltip } from "@mui/material";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import EditIcon from "@mui/icons-material/Edit";
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
      <div className="rounded-lg border border-[#5865F2] bg-[#2E3944] p-4">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-muted text-lg font-semibold">About Me</h2>
          {currentUserId === user.id && !isEditingBio && (
            <Tooltip
              title="Edit bio"
              placement="top"
              arrow
              slotProps={{
                tooltip: {
                  sx: {
                    backgroundColor: "#0F1419",
                    color: "#D3D9D4",
                    fontSize: "0.75rem",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #2E3944",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                    "& .MuiTooltip-arrow": {
                      color: "#0F1419",
                    },
                  },
                },
              }}
            >
              <Button
                variant="text"
                onClick={() => setIsEditingBio(true)}
                sx={{
                  color: "#5865F2",
                  minWidth: "auto",
                  padding: "4px",
                  "&:hover": {
                    backgroundColor: "rgba(88, 101, 242, 0.1)",
                  },
                }}
              >
                <EditIcon className="h-5 w-5" />
              </Button>
            </Tooltip>
          )}
        </div>

        {isEditingBio && currentUserId === user.id ? (
          <div className="space-y-2">
            <textarea
              className="text-muted w-full resize-none rounded-md border border-[#5865F2] bg-[#212A31] p-2 focus:ring-2 focus:ring-[#5865F2] focus:outline-none"
              rows={3}
              value={newBio}
              onChange={handleBioChange}
              placeholder="Write something about yourself..."
              maxLength={MAX_BIO_LENGTH}
              style={{ wordWrap: "break-word", overflowWrap: "break-word" }}
            />
            <div className="flex items-center justify-between">
              <span
                className={`text-xs ${newBio.length >= MAX_BIO_LENGTH ? "text-red-400" : "text-muted"}`}
              >
                {newBio.length}/{MAX_BIO_LENGTH} characters
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsEditingBio(false);
                    setNewBio(bio || "");
                  }}
                  className="cursor-pointer rounded bg-gray-600 px-4 py-1.5 text-sm font-medium text-[#D3D9D4] transition-colors hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveBio}
                  disabled={isSavingBio}
                  className={`rounded px-4 py-1.5 text-sm font-medium transition-colors ${
                    isSavingBio
                      ? "cursor-wait bg-[#5865F2] text-[#D3D9D4] opacity-70"
                      : "cursor-pointer bg-[#5865F2] text-[#D3D9D4] hover:bg-[#4752C4]"
                  } disabled:cursor-wait disabled:opacity-70`}
                >
                  {isSavingBio ? "Saving..." : "Save"}
                </button>
              </div>
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
                    <p className="text-muted break-words whitespace-pre-wrap">
                      {convertUrlsToLinks(visibleLines.join("\n"))}
                    </p>
                    {shouldTruncate && (
                      <button
                        className="mt-2 flex items-center gap-1 text-sm font-medium text-blue-300 transition-colors duration-200 hover:text-blue-400 hover:underline"
                        onClick={() => setBioExpanded((e) => !e)}
                      >
                        {bioExpanded ? (
                          <>
                            <FaChevronUp className="h-4 w-4" />
                            Show less
                          </>
                        ) : (
                          <>
                            <FaChevronDown className="h-4 w-4" />
                            Read more
                          </>
                        )}
                      </button>
                    )}
                  </>
                );
              })()
            ) : (
              <p className="text-[#FFFFFF] italic">No bio yet</p>
            )}
            {localBioLastUpdated && (
              <p className="mt-2 text-xs text-[#FFFFFF]">
                Last updated:{" "}
                <Tooltip
                  title={formatCustomDate(localBioLastUpdated)}
                  placement="top"
                  arrow
                  slotProps={{
                    tooltip: {
                      sx: {
                        backgroundColor: "#0F1419",
                        color: "#D3D9D4",
                        fontSize: "0.75rem",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "1px solid #2E3944",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                        "& .MuiTooltip-arrow": {
                          color: "#0F1419",
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
