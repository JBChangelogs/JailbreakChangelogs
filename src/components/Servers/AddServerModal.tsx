"use client";

import React from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuthContext } from "@/contexts/AuthContext";
import { Dialog, DialogPanel } from "@headlessui/react";
import { Icon } from "@/components/ui/IconWrapper";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  validatePrivateServerLink,
  validateServerRulesText,
} from "@/utils/serverValidation";

interface AddServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onServerAdded: () => void;
  editingServer?: {
    id: number;
    link: string;
    owner: string;
    rules: string;
    expires: string;
  } | null;
}

const AddServerModal: React.FC<AddServerModalProps> = ({
  isOpen,
  onClose,
  onServerAdded,
  editingServer,
}) => {
  const { isAuthenticated } = useAuthContext();
  const [link, setLink] = React.useState("");
  const [rules, setRules] = React.useState("");
  const [expires, setExpires] = React.useState<Date | null>(null);
  const [expiresTime, setExpiresTime] = React.useState("00:00:00");
  const [neverExpires, setNeverExpires] = React.useState(false);
  const [originalExpires, setOriginalExpires] = React.useState<Date | null>(
    null,
  );
  const [originalExpiresTime, setOriginalExpiresTime] =
    React.useState("00:00:00");
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  // Character limits
  const MAX_RULES_LENGTH = 200;

  // Handle rules input with character limit
  const handleRulesChange = (value: string) => {
    if (value.length <= MAX_RULES_LENGTH) {
      setRules(value);
    }
  };

  const cleanRulesText = (text: string): string => {
    return text
      .replace(/\p{M}+/gu, "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .join("\n")
      .replace(/\n\n+/g, "\n\n"); // Collapse multiple consecutive newlines to just two
  };

  const formatTimeForInput = (date: Date): string => {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  const applyTimeToDate = (date: Date, timeValue: string): Date => {
    const [h = "0", m = "0", s = "0"] = timeValue.split(":");
    const hours = Number.parseInt(h, 10) || 0;
    const minutes = Number.parseInt(m, 10) || 0;
    const seconds = Number.parseInt(s, 10) || 0;
    const next = new Date(date);
    next.setHours(hours, minutes, seconds, 0);
    return next;
  };

  const minSelectableDate = React.useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 7);
    return date;
  }, []);

  const initialCalendarMonth = React.useMemo(() => {
    if (expires && expires >= minSelectableDate) return expires;
    return minSelectableDate;
  }, [expires, minSelectableDate]);

  // Reset form when modal opens/closes or editingServer changes
  React.useEffect(() => {
    if (isOpen) {
      // gate via auth hook
      if (!isAuthenticated) {
        toast.error("Please log in to add a server");
        onClose();
        return;
      }

      if (editingServer) {
        setLink(editingServer.link);
        setRules(editingServer.rules);
        if (editingServer.expires === "Never") {
          setNeverExpires(true);
          setExpires(null);
          setOriginalExpires(null);
          setExpiresTime("00:00:00");
          setOriginalExpiresTime("00:00:00");
        } else {
          const expirationDate = new Date(
            parseInt(editingServer.expires) * 1000,
          );
          const expirationTime = formatTimeForInput(expirationDate);
          setNeverExpires(false);
          setExpires(expirationDate);
          setOriginalExpires(expirationDate);
          setExpiresTime(expirationTime);
          setOriginalExpiresTime(expirationTime);
        }
      } else {
        // Reset form for new server
        const today = new Date();
        setLink("");
        setRules("");
        setExpires(today);
        setOriginalExpires(null);
        setExpiresTime(formatTimeForInput(today));
        setOriginalExpiresTime("00:00:00");
        setNeverExpires(false);
      }
    }
  }, [isOpen, editingServer, onClose, isAuthenticated]);

  const handleSubmit = async () => {
    if (!link.trim()) {
      toast.error("Please enter a server link");
      return;
    }

    if (rules.length > MAX_RULES_LENGTH) {
      toast.error(`Server rules cannot exceed ${MAX_RULES_LENGTH} characters`);
      return;
    }

    if (!neverExpires && !expires) {
      toast.error("Please select an expiration date");
      return;
    }

    const expiresWithTime =
      !neverExpires && expires ? applyTimeToDate(expires, expiresTime) : null;

    const normalizedLink = link.trim();
    const normalizedRules = cleanRulesText(rules) || "N/A";

    const linkValidation = validatePrivateServerLink(normalizedLink);
    if (!linkValidation.isValid) {
      toast.error(linkValidation.message || "Invalid server link");
      return;
    }

    const rulesValidation = validateServerRulesText(normalizedRules);
    if (!rulesValidation.isValid) {
      toast.error(rulesValidation.message || "Invalid server rules");
      return;
    }

    // Check if the expiration date is in the past
    if (!neverExpires && expiresWithTime) {
      const now = new Date();
      if (expiresWithTime < now) {
        toast.error("Expiration date cannot be in the past");
        return;
      }

      // Check if expiration date is at least 7 days from now
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      if (expiresWithTime < sevenDaysFromNow) {
        toast.error("Expiration date must be at least 7 days from now");
        return;
      }
    }

    // Check if the expiration date is more than 1 year away
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    const normalizedExpires =
      neverExpires || (expiresWithTime && expiresWithTime > oneYearFromNow)
        ? "Never"
        : expiresWithTime
          ? String(Math.floor(expiresWithTime.getTime() / 1000))
          : null;

    if (editingServer) {
      const originalLink = editingServer.link.trim();
      const originalRules = cleanRulesText(editingServer.rules) || "N/A";
      const originalExpires =
        editingServer.expires === "Never"
          ? "Never"
          : (() => {
              const parsed = parseInt(editingServer.expires, 10);
              if (Number.isNaN(parsed)) return editingServer.expires;
              // Normalize to seconds for reliable comparisons.
              return String(
                parsed > 10000000000 ? Math.floor(parsed / 1000) : parsed,
              );
            })();

      const hasChanges =
        normalizedLink !== originalLink ||
        normalizedRules !== originalRules ||
        normalizedExpires !== originalExpires;

      if (!hasChanges) {
        onClose();
        return;
      }
    }

    // auth enforced server-side via cookie; client just gates UX

    setLoading(true);
    const savingToastId = toast.loading(
      editingServer ? "Saving server changes..." : "Adding server...",
    );
    try {
      const endpoint = editingServer
        ? `/api/servers/update?id=${editingServer.id}`
        : `/api/servers/add`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          link: normalizedLink,
          rules: normalizedRules,
          expires: normalizedExpires,
        }),
      });

      if (response.ok) {
        toast.success(
          editingServer
            ? "Server updated successfully!"
            : "Server added successfully!",
          { id: savingToastId },
        );
        onServerAdded();
        onClose();
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Failed to save server" }));
        if (response.status === 409) {
          toast.error("This server already exists", { id: savingToastId });
        } else if (response.status === 403) {
          toast.error(
            "Server link must start with: https://www.roblox.com/share?code=",
            { id: savingToastId },
          );
        } else {
          toast.error(`Error saving server: ${errorData.message}`, {
            id: savingToastId,
          });
        }
      }
    } catch (err) {
      toast.error("An error occurred while saving the server", {
        id: savingToastId,
      });
      console.error("Save server error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={() => {}} className="relative z-[3000]">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="border-border-card bg-secondary-bg hover:border-border-focus relative w-full max-w-md rounded-lg border shadow-xl">
          {/* Header */}
          <div className="border-border-card flex items-center justify-between border-b p-4">
            <h2 className="text-primary-text text-xl font-semibold">
              {editingServer ? "Edit Server" : "Add New Server"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="text-secondary-text hover:text-primary-text hover:bg-quaternary-bg focus-visible:ring-ring inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:ring-1 focus-visible:outline-none"
            >
              <Icon icon="heroicons:x-mark" className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-6">
            <div className="space-y-6">
              <div>
                <label
                  htmlFor="server-link"
                  className="text-primary-text mb-2 block text-sm font-medium"
                >
                  Server Link<span className="text-button-danger ml-1">*</span>
                </label>
                <input
                  id="server-link"
                  type="text"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="border-border-card bg-primary-bg text-primary-text placeholder-secondary-text hover:border-border-focus focus:border-button-info w-full rounded-md border px-3 py-2 focus:outline-none"
                  placeholder="https://www.roblox.com/share?code=..."
                />
                <p className="text-secondary-text mt-1 text-sm">
                  Enter your full private server link
                </p>
              </div>

              <div>
                <label
                  htmlFor="server-rules"
                  className="text-primary-text mb-2 block text-sm font-medium"
                >
                  Server Rules
                </label>
                <textarea
                  id="server-rules"
                  value={rules}
                  onChange={(e) => handleRulesChange(e.target.value)}
                  rows={4}
                  maxLength={MAX_RULES_LENGTH}
                  className="border-border-card bg-primary-bg text-primary-text placeholder-secondary-text hover:border-border-focus focus:border-button-info w-full rounded-md border px-3 py-2 focus:outline-none"
                  placeholder="What are the rules for this server?"
                />
                <p className="text-secondary-text mt-1 text-sm">
                  Optional: Add any specific rules or requirements
                </p>
              </div>

              <div>
                <div className="text-primary-text mb-3 flex items-center text-sm font-medium">
                  Expires<span className="text-button-danger ml-1">*</span>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="w-full sm:flex-1">
                    <label
                      htmlFor="server-expiry-date"
                      className={`mb-2 block text-sm font-medium ${
                        neverExpires
                          ? "text-secondary-text"
                          : "text-primary-text"
                      }`}
                    >
                      Date
                    </label>
                    <Popover
                      open={isDatePickerOpen}
                      onOpenChange={(open) => {
                        if (neverExpires) return;
                        setIsDatePickerOpen(open);
                      }}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          id="server-expiry-date"
                          type="button"
                          variant="ghost"
                          disabled={neverExpires}
                          style={{
                            backgroundColor: "var(--color-tertiary-bg)",
                          }}
                          className="border-border-card bg-tertiary-bg text-primary-text hover:border-border-focus hover:bg-tertiary-bg! active:bg-tertiary-bg! disabled:bg-tertiary-bg h-10 w-full justify-between rounded-md border px-3 py-2 font-normal disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <span>{format(expires ?? new Date(), "PPP")}</span>
                          <Icon icon="heroicons:chevron-down" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        align="start"
                        className="border-border-card bg-secondary-bg z-[3100] w-auto p-0"
                      >
                        <Calendar
                          mode="single"
                          selected={expires ?? undefined}
                          defaultMonth={initialCalendarMonth}
                          onSelect={(date) => {
                            setExpires(date ?? null);
                            setIsDatePickerOpen(false);
                          }}
                          disabled={(date) => date < minSelectableDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="w-full shrink-0 sm:w-36">
                    <label
                      htmlFor="server-expiry-time"
                      className={`mb-2 block text-sm font-medium ${
                        neverExpires
                          ? "text-secondary-text"
                          : "text-primary-text"
                      }`}
                    >
                      Time
                    </label>
                    <input
                      id="server-expiry-time"
                      type="time"
                      step={1}
                      value={expiresTime}
                      disabled={neverExpires}
                      onChange={(event) => setExpiresTime(event.target.value)}
                      style={{ backgroundColor: "var(--color-tertiary-bg)" }}
                      className="border-border-card bg-tertiary-bg text-primary-text hover:border-border-focus focus:border-button-info disabled:bg-tertiary-bg h-10 w-full appearance-none rounded-md border px-3 py-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                    />
                  </div>
                </div>
                <p className="text-secondary-text mt-1 text-sm">
                  Must be at least 7 days from now.
                </p>

                <label className="mt-3 flex cursor-pointer items-center space-x-2">
                  <Checkbox
                    checked={neverExpires}
                    onCheckedChange={(checked) => {
                      const isChecked = checked === true;
                      setNeverExpires(isChecked);
                      if (!isChecked && !expires) {
                        const restoredDate = originalExpires ?? new Date();
                        setExpires(restoredDate);
                        setExpiresTime(
                          originalExpires
                            ? originalExpiresTime
                            : formatTimeForInput(restoredDate),
                        );
                      }
                    }}
                  />
                  <span className="text-primary-text text-sm">
                    Never expires
                  </span>
                </label>
                {neverExpires && (
                  <p className="text-secondary-text mt-1 text-sm">
                    Expiry fields are disabled because this server never
                    expires.
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="border-border-card mt-8 flex justify-end border-t pt-6">
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  variant="default"
                  size="md"
                  data-umami-event={
                    editingServer ? "Edit Server" : "Add Server"
                  }
                >
                  {loading
                    ? editingServer
                      ? "Saving Changes..."
                      : "Adding Server..."
                    : editingServer
                      ? "Edit Server"
                      : "Add Server"}
                </Button>
              </div>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};

export default AddServerModal;
