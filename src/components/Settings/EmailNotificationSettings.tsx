"use client";

import { useState, useEffect } from "react";
import { Field, Label, Description } from "@headlessui/react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import { toast } from "sonner";
import { UserData } from "@/types/auth";
import { Switch } from "@/components/ui/switch";

interface EmailNotificationSettingsProps {
  userData: UserData | null;
}

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export const EmailNotificationSettings = ({
  userData,
}: EmailNotificationSettingsProps) => {
  const [enabled, setEnabled] = useState(false);
  const [isLinked, setIsLinked] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      if (!userData) return;
      setCheckingStatus(true);
      try {
        const [linkedRes, enabledRes] = await Promise.all([
          fetch("/api/users/email/linked", { cache: "no-store" }),
          fetch("/api/notifications/emails/status", { cache: "no-store" }),
        ]);

        if (linkedRes.ok) {
          const data = await linkedRes.json();
          setIsLinked(data.linked === true);
        }

        if (enabledRes.ok) {
          const data = await enabledRes.json();
          setEnabled(data.enabled === true);
        }
      } catch (e) {
        console.error("Failed to check email status", e);
      } finally {
        setCheckingStatus(false);
      }
    };
    checkStatus();
  }, [userData]);

  const handleToggle = async (checked: boolean) => {
    if (!userData) return;
    setLoading(true);

    try {
      if (checked) {
        const response = await fetch("/api/notifications/emails/enable", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });

        let data: { message?: string; detail?: string } = {};
        try {
          data = await response.json();
        } catch {}

        if (response.ok) {
          setEnabled(true);
          toast.success("Email Notifications Enabled", {
            description: "You will now receive email notifications.",
          });
          setIsLinked(true);
        } else {
          if (response.status === 404) {
            const errorMessage =
              data.message || data.detail || "Please link your email first.";
            toast.error("Email Not Linked", {
              description: errorMessage,
            });
          } else if (response.status >= 500) {
            toast.error("Error", {
              description: "Something went wrong. Please try again later.",
            });
          } else {
            const errorMessage =
              data.message || data.detail || "Failed to enable notifications.";
            toast.error("Error", {
              description: errorMessage,
            });
          }
          setEnabled(false);
        }
      } else {
        const response = await fetch("/api/notifications/emails/disable", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });

        let data: { message?: string; detail?: string } = {};
        try {
          data = await response.json();
        } catch {}

        if (response.ok) {
          setEnabled(false);
          toast.success("Email Notifications Disabled");
        } else {
          if (response.status === 404) {
            const errorMessage =
              data.message || data.detail || "Please link your email first.";
            toast.error("Email Not Linked", {
              description: errorMessage,
            });
            // Revert state since the action failed
            setEnabled(true);
          } else if (response.status >= 500) {
            toast.error("Error", {
              description: "Something went wrong. Please try again later.",
            });
            setEnabled(true); // Revert state on error
          } else {
            const errorMessage =
              data.message || data.detail || "Failed to disable notifications.";
            toast.error("Error", {
              description: errorMessage,
            });
            setEnabled(true); // Revert state on error
          }
        }
      }
    } catch (error) {
      console.error("Error toggling email notifications:", error);
      toast.error("Something went wrong");
      setEnabled(!checked);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkEmail = () => {
    window.location.href = "/api/notifications/emails/link";
  };

  const handleUnlinkClick = () => {
    setShowUnlinkConfirm(true);
  };

  const handleUnlinkConfirm = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users/email/unlink", {
        method: "DELETE",
        cache: "no-store",
      });
      let data: { message?: string; detail?: string } = {};
      try {
        data = await res.json();
      } catch {}
      if (res.ok) {
        toast.success("Email Unlinked");
        setIsLinked(false);
        setEnabled(false);
      } else {
        if (res.status >= 500) {
          toast.error("Failed to unlink", {
            description: "Something went wrong. Please try again later.",
          });
        } else {
          const errorMessage =
            data.message || data.detail || "Failed to unlink email";
          toast.error("Failed to unlink", { description: errorMessage });
        }
      }
    } catch {
      toast.error("Error unlinking email");
    } finally {
      setLoading(false);
      setShowUnlinkConfirm(false);
    }
  };

  return (
    <div className="mb-6">
      <div className="flex flex-col gap-4">
        {/* Toggle Section */}
        {/* ... existing code ... */}
        <Field className="w-full">
          <div className="mb-1 flex w-full items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <Label className="text-primary-text flex items-center gap-2 text-base font-medium">
                <Icon icon="heroicons:envelope" className="h-5 w-5" />
                Email Notifications
              </Label>
              <Description className="text-secondary-text mt-1 text-sm">
                Receive important updates and notifications via email.
              </Description>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={handleToggle}
              disabled={loading || !userData}
            />
          </div>
        </Field>

        {/* Link/Unlink Email Button */}
        <div className="flex items-center gap-2">
          {checkingStatus ? (
            <Button variant="outline" size="sm" disabled>
              Loading...
            </Button>
          ) : isLinked ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleUnlinkClick}
              disabled={loading}
            >
              <Icon icon="heroicons:link-slash" className="mr-2 h-4 w-4" />
              Unlink Email
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLinkEmail}
              disabled={!userData || loading}
            >
              <Icon icon="heroicons:link" className="mr-2 h-4 w-4" />
              Link Email
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showUnlinkConfirm}
        onClose={() => setShowUnlinkConfirm(false)}
        onConfirm={handleUnlinkConfirm}
        title="Unlink Email"
        message="Are you sure you want to unlink your email? You will stop receiving notifications."
        confirmText="Unlink"
        cancelText="Cancel"
        confirmVariant="destructive"
      />
    </div>
  );
};
