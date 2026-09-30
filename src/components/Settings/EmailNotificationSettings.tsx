"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Field, Label, Description } from "@headlessui/react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import { toast } from "sonner";
import { UserData } from "@/types/auth";
import { Switch } from "@/components/ui/switch";
import {
  fetchEmailLinkedStatus,
  fetchEmailNotificationStatus,
  enableEmailNotifications,
  disableEmailNotifications,
  unlinkEmail,
  getEmailLinkUrl,
} from "@/utils/api/api";

interface EmailNotificationSettingsProps {
  userData: UserData | null;
}

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { createLogger } from "@/services/logger";

const log = createLogger("UI");

export const EmailNotificationSettings = ({
  userData,
}: EmailNotificationSettingsProps) => {
  const userId = userData?.id;
  const queryClient = useQueryClient();
  const linkedKey = ["email", "linked", userId] as const;
  const statusKey = ["email", "notifications", userId] as const;
  const linkedQuery = useQuery({
    queryKey: linkedKey,
    queryFn: fetchEmailLinkedStatus,
    enabled: !!userId,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
  const statusQuery = useQuery({
    queryKey: statusKey,
    queryFn: fetchEmailNotificationStatus,
    enabled: !!userId,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
  const enabled = statusQuery.data?.enabled === true;
  const isLinked = linkedQuery.data?.linked === true;
  const [loading, setLoading] = useState(false);
  const checkingStatus =
    !!userId && (linkedQuery.isPending || statusQuery.isPending);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);

  const handleToggle = async (checked: boolean) => {
    if (!userData) return;
    setLoading(true);

    try {
      if (checked) {
        const { ok, status, data } = await enableEmailNotifications();
        if (ok) {
          queryClient.setQueryData(statusKey, { enabled: true });
          toast.success("Email Notifications Enabled", {
            description: "You will now receive email notifications.",
          });
          queryClient.setQueryData(linkedKey, { linked: true });
        } else {
          if (status === 404) {
            toast.error("Email Not Linked", {
              description:
                data.message || data.detail || "Please link your email first.",
            });
          } else if (status >= 500) {
            toast.error("Error", {
              description: "Something went wrong. Please try again later.",
            });
          } else {
            toast.error("Error", {
              description:
                data.message ||
                data.detail ||
                "Failed to enable notifications.",
            });
          }
        }
      } else {
        const { ok, status, data } = await disableEmailNotifications();
        if (ok) {
          queryClient.setQueryData(statusKey, { enabled: false });
          toast.success("Email Notifications Disabled");
        } else {
          if (status === 404) {
            toast.error("Email Not Linked", {
              description:
                data.message || data.detail || "Please link your email first.",
            });
          } else if (status >= 500) {
            toast.error("Error", {
              description: "Something went wrong. Please try again later.",
            });
          } else {
            toast.error("Error", {
              description:
                data.message ||
                data.detail ||
                "Failed to disable notifications.",
            });
          }
        }
      }
    } catch (error) {
      log.error("Error toggling email notifications:", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleLinkEmail = () => {
    window.location.href = getEmailLinkUrl();
  };

  const handleUnlinkClick = () => {
    setShowUnlinkConfirm(true);
  };

  const handleUnlinkConfirm = async () => {
    setLoading(true);
    try {
      const { ok, status, data } = await unlinkEmail();
      if (ok) {
        toast.success("Email Unlinked");
        queryClient.setQueryData(linkedKey, { linked: false });
        queryClient.setQueryData(statusKey, { enabled: false });
      } else {
        if (status >= 500) {
          toast.error("Failed to unlink", {
            description: "Something went wrong. Please try again later.",
          });
        } else {
          toast.error("Failed to unlink", {
            description:
              data.message || data.detail || "Failed to unlink email",
          });
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
              disabled={
                loading ||
                checkingStatus ||
                !userData ||
                linkedQuery.isError ||
                statusQuery.isError
              }
            />
          </div>
        </Field>

        {(linkedQuery.isError || statusQuery.isError) && (
          <p className="text-status-error text-sm">
            Could not load email settings. Please try again.
          </p>
        )}

        {/* Link/Unlink Email Button */}
        <div className="flex items-center gap-2">
          {linkedQuery.isError || statusQuery.isError ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void linkedQuery.refetch();
                void statusQuery.refetch();
              }}
            >
              Retry
            </Button>
          ) : checkingStatus ? (
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
