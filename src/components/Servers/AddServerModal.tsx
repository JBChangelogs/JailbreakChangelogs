"use client";

import React from "react";
import { toast } from "react-hot-toast";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { useAuthContext } from "@/contexts/AuthContext";
import { Dialog, DialogPanel } from "@headlessui/react";

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
  const [neverExpires, setNeverExpires] = React.useState(false);
  const [originalExpires, setOriginalExpires] = React.useState<Date | null>(
    null,
  );
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
      .split(/\r?\n/)
      .map((line) => line.trim())
      .join("\n")
      .replace(/\n\n+/g, "\n\n"); // Collapse multiple consecutive newlines to just two
  };

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
        } else {
          const expirationDate = new Date(
            parseInt(editingServer.expires) * 1000,
          );
          setNeverExpires(false);
          setExpires(expirationDate);
          setOriginalExpires(expirationDate);
        }
      } else {
        // Reset form for new server
        setLink("");
        setRules("");
        setExpires(null);
        setOriginalExpires(null);
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

    // Check if the expiration date is in the past
    if (!neverExpires && expires) {
      const now = new Date();
      if (expires < now) {
        toast.error("Expiration date cannot be in the past");
        return;
      }

      // Check if expiration date is at least 7 days from now
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      if (expires < sevenDaysFromNow) {
        toast.error("Expiration date must be at least 7 days from now");
        return;
      }
    }

    // auth enforced server-side via cookie; client just gates UX

    setLoading(true);
    try {
      // Check if the expiration date is more than 1 year away
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

      const endpoint = editingServer
        ? `/api/servers/update?id=${editingServer.id}`
        : `/api/servers/add`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          link: link.trim(),
          rules: cleanRulesText(rules) || "N/A",
          expires:
            neverExpires || (expires && expires > oneYearFromNow)
              ? "Never"
              : expires
                ? String(Math.floor(expires.getTime() / 1000))
                : null,
        }),
      });

      if (response.ok) {
        toast.success(
          editingServer
            ? "Server updated successfully!"
            : "Server added successfully!",
        );
        onServerAdded();
        onClose();
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Failed to save server" }));
        if (response.status === 409) {
          toast.error("This server already exists");
        } else if (response.status === 403) {
          toast.error(
            "Server link must start with: https://www.roblox.com/share?code=",
          );
        } else {
          toast.error(`Error saving server: ${errorData.message}`);
        }
      }
    } catch (err) {
      toast.error("An error occurred while saving the server");
      console.error("Save server error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={() => {}} className="relative z-50">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="border-border-primary bg-secondary-bg hover:border-border-focus relative w-full max-w-md rounded-lg border shadow-xl">
          {/* Header */}
          <div className="border-border-primary flex items-center border-b p-4">
            <h2 className="text-primary-text text-xl font-semibold">
              {editingServer ? "Edit Server" : "Add New Server"}
            </h2>
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
                  className="border-border-primary bg-primary-bg text-primary-text placeholder-secondary-text hover:border-border-focus focus:border-button-info w-full rounded-md border px-3 py-2 focus:outline-none"
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
                  className="border-border-primary bg-primary-bg text-primary-text placeholder-secondary-text hover:border-border-focus focus:border-button-info w-full rounded-md border px-3 py-2 focus:outline-none"
                  placeholder="What are the rules for this server?"
                />
                <p className="text-secondary-text mt-1 text-sm">
                  Optional: Add any specific rules or requirements
                </p>
              </div>

              <div>
                <div className="text-primary-text mb-2 flex items-center text-sm font-medium">
                  Expires <span className="text-button-danger ml-1">*</span>
                </div>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    value={expires}
                    onChange={(date) => setExpires(date)}
                    minDate={new Date()}
                    disabled={neverExpires}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        variant: "outlined",
                        placeholder: "Select expiration date",
                        sx: {
                          backgroundColor: "var(--color-primary-bg) !important",
                          "& .MuiOutlinedInput-root": {
                            color: "var(--color-primary-text)",
                            backgroundColor:
                              "var(--color-primary-bg) !important",
                            "& fieldset": {
                              borderColor: "var(--color-border-primary)",
                            },
                            "&:hover fieldset": {
                              borderColor: "var(--color-button-info)",
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: "var(--color-button-info)",
                            },
                          },
                          "& .MuiInputLabel-root": {
                            color: "var(--color-primary-text)",
                          },
                          "& .MuiInputBase-input": {
                            backgroundColor:
                              "var(--color-primary-bg) !important",
                            "&::placeholder": {
                              color: "var(--color-secondary-text) !important",
                              opacity: "1 !important",
                            },
                          },
                          "& .MuiInputBase-root": {
                            backgroundColor:
                              "var(--color-primary-bg) !important",
                            "& .MuiInputAdornment-root": {
                              "& .MuiIconButton-root": {
                                color: "var(--color-secondary-text) !important",
                                "&:hover": {
                                  backgroundColor: "var(--color-quaternary-bg)",
                                },
                                "& svg": {
                                  color:
                                    "var(--color-secondary-text) !important",
                                },
                              },
                            },
                          },
                          "& .MuiPickersInputBase-root": {
                            "& .MuiInputAdornment-root": {
                              "& .MuiIconButton-root": {
                                color: "var(--color-secondary-text) !important",
                                "&:hover": {
                                  backgroundColor: "var(--color-quaternary-bg)",
                                },
                                "& svg": {
                                  color:
                                    "var(--color-secondary-text) !important",
                                },
                              },
                            },
                          },
                          "& .MuiPickersSectionList-root": {
                            "& .MuiPickersSectionList-section": {
                              color: "var(--color-secondary-text) !important",
                              "&::placeholder": {
                                color: "var(--color-secondary-text) !important",
                                opacity: "1 !important",
                              },
                            },
                          },
                          "& .mui-joz0rk-MuiPickersSectionList-section-MuiPickersInputBase-section":
                            {
                              color: "var(--color-secondary-text) !important",
                              "&::placeholder": {
                                color: "var(--color-secondary-text) !important",
                                opacity: "1 !important",
                              },
                            },
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "var(--color-border-primary)",
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "var(--color-button-info)",
                          },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "var(--color-button-info)",
                          },
                        },
                      },
                      popper: {
                        sx: {
                          "& .MuiPaper-root": {
                            backgroundColor: "var(--color-secondary-bg)",
                            color: "var(--color-primary-text)",
                            border: "1px solid var(--color-border-primary)",
                            "& .MuiPickersCalendarHeader-root": {
                              color: "var(--color-primary-text)",
                              "& .MuiIconButton-root": {
                                color: "var(--color-primary-text)",
                                "&:hover": {
                                  backgroundColor: "var(--color-quaternary-bg)",
                                },
                                "& svg": {
                                  color: "var(--color-primary-text) !important",
                                },
                              },
                              "& .MuiPickersArrowSwitcher-root": {
                                "& .MuiIconButton-root": {
                                  color: "var(--color-primary-text)",
                                  "&:hover": {
                                    backgroundColor:
                                      "var(--color-quaternary-bg)",
                                  },
                                  "& svg": {
                                    color:
                                      "var(--color-primary-text) !important",
                                  },
                                },
                              },
                              "& .MuiPickersCalendarHeader-labelContainer": {
                                "& .MuiIconButton-root": {
                                  color: "var(--color-primary-text)",
                                  "&:hover": {
                                    backgroundColor:
                                      "var(--color-quaternary-bg)",
                                  },
                                  "& svg": {
                                    color:
                                      "var(--color-primary-text) !important",
                                  },
                                },
                              },
                            },
                            "& .MuiDayCalendar-root": {
                              "& .MuiPickersDay-root": {
                                color: "var(--color-primary-text)",
                                backgroundColor: "transparent",
                                "&:hover": {
                                  backgroundColor: "var(--color-quaternary-bg)",
                                },
                                "&.Mui-selected": {
                                  backgroundColor: "var(--color-button-info)",
                                  color: "var(--color-form-button-text)",
                                  "&:hover": {
                                    backgroundColor:
                                      "var(--color-button-info-hover)",
                                  },
                                },
                                "&.Mui-disabled": {
                                  color: "var(--color-secondary-text)",
                                },
                              },
                            },
                            "& .MuiPickersMonth-root": {
                              color: "var(--color-primary-text)",
                              "&:hover": {
                                backgroundColor: "var(--color-quaternary-bg)",
                              },
                              "&.Mui-selected": {
                                backgroundColor: "var(--color-button-info)",
                                color: "var(--color-form-button-text)",
                              },
                            },
                            "& .MuiPickersYear-root": {
                              color: "var(--color-primary-text)",
                              "&:hover": {
                                backgroundColor: "var(--color-quaternary-bg)",
                              },
                              "&.Mui-selected": {
                                backgroundColor: "var(--color-button-info)",
                                color: "var(--color-form-button-text)",
                              },
                            },
                          },
                        },
                      },
                    }}
                  />
                </LocalizationProvider>
                <p className="text-secondary-text mt-1 text-sm">
                  When will this server link expire? <br />
                  (Must be at least 7 days from now)
                </p>
              </div>

              <div>
                <label className="flex cursor-pointer items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={neverExpires}
                    onChange={(e) => {
                      setNeverExpires(e.target.checked);
                      if (e.target.checked) {
                        setExpires(null);
                      } else {
                        setExpires(originalExpires);
                      }
                    }}
                    className="text-button-info focus:ring-button-info h-4 w-4 cursor-pointer rounded"
                  />
                  <span className="text-primary-text text-sm">
                    Never Expires
                  </span>
                </label>
                <p className="text-secondary-text mt-1 text-sm">
                  Toggle this if the server will remain active indefinitely
                </p>
              </div>

              {/* Actions */}
              <div className="border-border-primary mt-8 flex justify-end space-x-4 border-t pt-6">
                <button
                  onClick={onClose}
                  className="text-secondary-text hover:text-primary-text cursor-pointer rounded-md px-4 py-2 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  data-umami-event={
                    editingServer ? "Edit Server" : "Add Server"
                  }
                  className="bg-button-info text-form-button-text hover:bg-button-info-hover cursor-pointer rounded-md px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? editingServer
                      ? "Saving Changes..."
                      : "Adding Server..."
                    : editingServer
                      ? "Edit Server"
                      : "Add Server"}
                </button>
              </div>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};

export default AddServerModal;
