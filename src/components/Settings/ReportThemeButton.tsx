"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import { ReportReasonModal } from "@/components/ui/ReportReasonModal";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  reportMarketplaceTheme,
  ThemeApiError,
  type MarketplaceTheme,
} from "@/utils/api/userThemes";
import { UserAvatar } from "@/utils/ui/avatar";

export default function ReportThemeButton({
  theme,
  className,
}: {
  theme: Pick<MarketplaceTheme, "share_code" | "label" | "user">;
  className?: string;
}) {
  const { user, isAuthenticated } = useAuthContext();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const author = theme.user;
  if (!isAuthenticated || !author?.id || author.id === user?.id) return null;

  const submit = async (reportReason: string) => {
    try {
      await reportMarketplaceTheme(theme.share_code, reportReason);
      toast.success("Report submitted");
      setOpen(false);
      setReason("");
    } catch (err) {
      const message =
        err instanceof ThemeApiError
          ? err.code === "report_exists"
            ? "You've already reported this theme."
            : err.code === "self_report"
              ? "You can't report your own theme."
              : err.status === 404
                ? "This theme is no longer published."
                : err.message
          : err instanceof Error
            ? err.message
            : undefined;
      toast.error("Couldn't report the theme", { description: message });
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        className={className}
        onClick={() => {
          setReason("");
          setOpen(true);
        }}
      >
        <Icon icon="heroicons:flag" className="h-4 w-4" />
        Report
      </Button>
      <ReportReasonModal
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={submit}
        reportReason={reason}
        setReportReason={setReason}
        subject="theme"
        title={`Report ${theme.label}`}
      >
        <div className="text-secondary-text flex min-w-0 items-center gap-2 text-sm">
          <span className="shrink-0">Created by</span>
          <UserAvatar
            userId={author.id}
            avatarHash={author.avatar ?? null}
            username={author.username}
            custom_avatar={author.custom_avatar}
            premiumType={author.premiumtype}
            settings={author.settings}
            size={6}
            showBadge={false}
          />
          <span className="text-primary-text min-w-0 truncate font-medium">
            {author.username}
          </span>
        </div>
      </ReportReasonModal>
    </>
  );
}
