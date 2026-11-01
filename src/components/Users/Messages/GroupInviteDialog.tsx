"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AppDialog, groupErrorMessage } from "./GroupChatDialogs";
import {
  createGroupInvite,
  revokeGroupInvite,
  type GroupInvite,
} from "@/utils/api/groupChats";
import { groupInviteUrl } from "@/utils/messages/groupInvites";

export function GroupInviteDialog({
  groupId,
  onClose,
}: {
  groupId: string;
  onClose: () => void;
}) {
  const [invite, setInvite] = useState<GroupInvite | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    createGroupInvite(groupId)
      .then((result) => {
        if (active) setInvite(result);
      })
      .catch((err) => {
        if (active) setError(groupErrorMessage(err));
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [groupId]);

  const reset = async () => {
    setBusy(true);
    setError(null);
    try {
      if (invite) {
        await revokeGroupInvite(groupId);
        setInvite(null);
      }
      setInvite(await createGroupInvite(groupId));
    } catch (err) {
      setError(groupErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!invite) return;
    try {
      await navigator.clipboard.writeText(groupInviteUrl(invite.code));
      toast.success("Invite link copied");
      setError(null);
    } catch {
      setError("Couldn't copy the link. Select and copy it below.");
    }
  };

  return (
    <AppDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title="Invite link"
      footerClassName="border-t-0"
      description="Links expire after 7 days. Resetting disables the previous link."
      footer={
        <>
          <Button
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={() => void reset()}
          >
            {invite ? "Reset link" : "Retry"}
          </Button>
          <Button
            size="sm"
            disabled={busy || !invite}
            onClick={() => void copy()}
          >
            Copy link
          </Button>
        </>
      }
    >
      {busy && (
        <p role="status" className="text-secondary-text text-sm">
          Loading invite link…
        </p>
      )}
      {invite && (
        <input
          readOnly
          aria-label="Invite link"
          value={groupInviteUrl(invite.code)}
          onFocus={(event) => event.currentTarget.select()}
          className="border-border-card bg-quaternary-bg text-primary-text w-full rounded-lg border px-3 py-2 text-sm"
        />
      )}
      {error && (
        <p role="alert" className="text-form-error text-sm">
          {error}
        </p>
      )}
    </AppDialog>
  );
}
