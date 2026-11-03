"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import { ReportReasonModal } from "@/components/ui/ReportReasonModal";
import type { PrivateServer } from "@/types/server";
import { PUBLIC_API_URL } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { parseBan, showBanToast } from "@/utils/api/ban";
import { sanitizeText } from "@/utils/ui/sanitizeText";
import { UserAvatar } from "@/utils/ui/avatar";

export default function ReportServerButton({
  server,
}: {
  server: PrivateServer;
}) {
  const { isAuthenticated, user, setBan } = useAuthContext();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  if (!isAuthenticated || !user || user.id === server.user.id) return null;

  const closeModal = () => {
    setOpen(false);
    setReason("");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(server.link);
      toast.success("Server link copied to clipboard!");
    } catch {
      toast.error("Failed to copy server link");
    }
  };

  const submitReport = async (value: string) => {
    const reason = sanitizeText(value.trim());
    if (!reason) return;

    try {
      const { url, headers } = buildApiFetchRequest(
        PUBLIC_API_URL,
        `/v2/servers/${server.id}/reports`,
      );
      const response = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const ban = parseBan(response);
        if (ban) {
          setBan(ban);
          showBanToast(ban);
          return;
        }
        const data = await response.json().catch(() => ({}));
        if (data?.error === "report_exists") {
          toast.info("You have already reported this server.");
          closeModal();
          return;
        }
        if (data?.error === "self_report") {
          toast.error("You cannot report your own server.");
          closeModal();
          return;
        }
        if (response.status === 404) {
          toast.error("This server is no longer available.");
          closeModal();
          return;
        }
        throw new Error(
          data?.message ?? "Failed to submit report. Please try again.",
        );
      }

      toast.success("Report submitted");
      closeModal();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit report. Please try again.",
      );
    }
  };

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Icon icon="heroicons:flag" className="h-4 w-4" />
        Report
      </Button>
      {open && (
        <ReportReasonModal
          open={open}
          onClose={closeModal}
          onSubmit={submitReport}
          reportReason={reason}
          setReportReason={setReason}
          subject="server"
          title="Report Private Server"
        >
          <div className="border-border-card bg-tertiary-bg/50 space-y-3 rounded-lg border p-3">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <div className="shrink-0">
                <UserAvatar
                  userId={server.user.id}
                  avatarHash={server.user.avatar}
                  username={server.user.username}
                  custom_avatar={server.user.custom_avatar ?? undefined}
                  size={7}
                  showBadge={false}
                  settings={server.user.settings}
                  premiumType={server.user.premiumtype}
                />
              </div>
              <span className="text-primary-text min-w-0 truncate text-sm font-semibold">
                {server.user.username}
              </span>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <p
                className="text-secondary-text min-w-0 flex-1 truncate text-xs"
                title={server.link}
              >
                {server.link}
              </p>
              <Button
                variant="ghost"
                size="xs"
                onClick={copyLink}
                aria-label="Copy server link"
              >
                <Icon icon="heroicons:clipboard" />
                Copy link
              </Button>
            </div>
            <p className="text-primary-text/80 line-clamp-4 text-sm break-words">
              {server.rules && server.rules !== "N/A"
                ? sanitizeText(server.rules)
                : "No rules set by owner"}
            </p>
          </div>
        </ReportReasonModal>
      )}
    </>
  );
}
