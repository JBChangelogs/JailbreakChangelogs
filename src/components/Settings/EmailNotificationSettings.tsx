"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import { toast } from "sonner";
import { UserData } from "@/types/auth";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SettingRow } from "@/components/Settings/SettingRow";
import {
  fetchEmailLinkedStatus,
  fetchEmailNotificationStatus,
  enableEmailNotifications,
  disableEmailNotifications,
  unlinkEmail,
  getEmailLinkUrl,
} from "@/utils/api/api";
import { createLogger } from "@/services/logger";

const log = createLogger("UI");

type EmailUpdateState = {
  loading: boolean;
  setLoading: (loading: boolean) => void;
};

/**
 * Whether the user's email is linked and its notifications are on. Shared by
 * the notification toggle and the email connection, which sit in different
 * settings cards but read and update the same cached status.
 */
function useEmailStatus(userId: string | undefined) {
  const queryClient = useQueryClient();
  const linkedKey = ["email", "linked", userId] as const;
  const statusKey = ["email", "notifications", userId] as const;
  const options = {
    enabled: !!userId,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  };
  const linkedQuery = useQuery({
    ...options,
    queryKey: linkedKey,
    queryFn: fetchEmailLinkedStatus,
  });
  const statusQuery = useQuery({
    ...options,
    queryKey: statusKey,
    queryFn: fetchEmailNotificationStatus,
  });
  return {
    isLinked: linkedQuery.data?.linked === true,
    enabled: statusQuery.data?.enabled === true,
    checking: !!userId && (linkedQuery.isPending || statusQuery.isPending),
    isError: linkedQuery.isError || statusQuery.isError,
    retry: () => {
      void linkedQuery.refetch();
      void statusQuery.refetch();
    },
    setLinked: (linked: boolean) =>
      queryClient.setQueryData(linkedKey, { linked }),
    setEnabled: (enabled: boolean) =>
      queryClient.setQueryData(statusKey, { enabled }),
  };
}

type ApiResult = {
  ok: boolean;
  status: number;
  data: { message?: string; detail?: string };
};

function toastFailure({ status, data }: ApiResult, fallback: string) {
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
      description: data.message || data.detail || fallback,
    });
  }
}

/** The email notifications switch, under Delivery. */
export const EmailNotificationSettings = ({
  userData,
  loading,
  setLoading,
}: {
  userData: UserData | null;
} & EmailUpdateState) => {
  const email = useEmailStatus(userData?.id);

  const handleToggle = async (checked: boolean) => {
    if (!userData || loading) return;
    setLoading(true);
    try {
      const result = checked
        ? await enableEmailNotifications()
        : await disableEmailNotifications();
      if (result.ok) {
        email.setEnabled(checked);
        if (checked) {
          email.setLinked(true);
          toast.success("Email Notifications Enabled", {
            description: "You will now receive email notifications.",
          });
        } else {
          toast.success("Email Notifications Disabled");
        }
      } else {
        toastFailure(
          result,
          checked
            ? "Failed to enable notifications."
            : "Failed to disable notifications.",
        );
      }
    } catch (error) {
      log.error("Error toggling email notifications:", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <SettingRow
        title="Email Notifications"
        highlight
        description={
          email.isError
            ? "Could not load email settings. Please try again."
            : email.checking || email.isLinked
              ? "Receive important updates and notifications via email."
              : "Link an email in Connections to get notifications by email."
        }
        action={
          <Switch
            aria-label="Email notifications"
            checked={email.enabled}
            onCheckedChange={handleToggle}
            disabled={
              loading ||
              email.checking ||
              !userData ||
              email.isError ||
              !email.isLinked
            }
          />
        }
      />
    </div>
  );
};

/** Link or unlink an email, under Connections. */
export const EmailConnection = ({
  userData,
  loading,
  setLoading,
}: { userData: UserData } & EmailUpdateState) => {
  const email = useEmailStatus(userData.id);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);

  const handleUnlinkConfirm = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const { ok, status, data } = await unlinkEmail();
      if (ok) {
        toast.success("Email Unlinked");
        email.setLinked(false);
        email.setEnabled(false);
      } else {
        toast.error("Failed to unlink", {
          description:
            status >= 500
              ? "Something went wrong. Please try again later."
              : data.message || data.detail || "Failed to unlink email",
        });
      }
    } catch {
      toast.error("Error unlinking email");
    } finally {
      setLoading(false);
      setShowUnlinkConfirm(false);
    }
  };

  return (
    <>
      <SettingRow
        title="Email"
        description={
          email.isError
            ? "Could not load your email status. Please try again."
            : email.isLinked
              ? "Your email is linked, so you can get notifications by email."
              : "Link an email to get notifications by email."
        }
        action={
          email.isError ? (
            <Button variant="secondary" size="md" onClick={email.retry}>
              Retry
            </Button>
          ) : email.checking ? (
            <Button variant="secondary" size="md" disabled>
              Loading...
            </Button>
          ) : email.isLinked ? (
            <Button
              variant="destructive"
              size="md"
              onClick={() => setShowUnlinkConfirm(true)}
              disabled={loading}
            >
              Unlink Email
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                window.location.href = getEmailLinkUrl();
              }}
              disabled={loading}
            >
              <Icon icon="heroicons:link" aria-hidden="true" />
              Link Email
            </Button>
          )
        }
      />
      <ConfirmDialog
        isOpen={showUnlinkConfirm}
        onClose={() => setShowUnlinkConfirm(false)}
        onConfirm={handleUnlinkConfirm}
        confirmDisabled={loading}
        title="Unlink Email"
        message="Are you sure you want to unlink your email? You will stop receiving notifications."
        confirmText="Unlink"
        cancelText="Cancel"
        confirmVariant="destructive"
      />
    </>
  );
};
