"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUserSearch } from "@/hooks/useUserSearch";
import { UserAvatar } from "@/utils/ui/avatar";
import { cn } from "@/lib/utils";
import { getDisplayName } from "@/utils/messages/formatting";
import type { MessageUser } from "@/utils/messages/types";
import {
  deleteGroupChat,
  fetchMessageUsers,
  GROUP_MEMBER_LIMIT,
  GROUP_NAME_MAX,
  GroupChatError,
  removeGroupMember,
  renameGroupChat,
  type GroupChat,
} from "@/utils/api/groupChats";

// The desktop app's group dialogs: New Message / Invite (one picker), Edit
// group name, and Leave (with Delete for the owner).

const INPUT =
  "border-border-card bg-secondary-bg text-primary-text placeholder-secondary-text focus:border-button-info h-10 w-full rounded-xl border px-3 text-sm transition-colors focus:outline-none";

/** Turns a group API error into words, naming who couldn't be added. */
export function groupErrorMessage(
  error: unknown,
  picked: MessageUser[] = [],
): string {
  if (!(error instanceof GroupChatError)) {
    return error instanceof Error ? error.message : "Something went wrong.";
  }
  if (error.code === "unmessageable") {
    const user = picked.find((item) => item.id === error.userId);
    return `You can't add ${user ? getDisplayName(user) : "someone you picked"}: you can only add people you could message.`;
  }
  if (error.code === "too_many_members") {
    return `Groups can have up to ${GROUP_MEMBER_LIMIT} members, you included.`;
  }
  return error.message;
}

/**
 * A dialog laid out like the desktop app's: title and text, the body, then a
 * footer with Cancel and the confirm button.
 */
export function AppDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm overflow-visible p-0" showClose>
        <div className="px-5 pt-5">
          <DialogTitle className="text-base">{title}</DialogTitle>
          {description && (
            <DialogDescription className="mt-1">
              {description}
            </DialogDescription>
          )}
        </div>
        {children && <div className="space-y-3 px-5 py-4">{children}</div>}
        <div className="border-border-primary mt-1 flex shrink-0 items-center justify-end gap-2 border-t px-5 py-4">
          {footer}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Pick people with checkboxes: the New Message and Invite to Group modals.
 * Before anything is searched it offers `suggested` (people you message);
 * picked people stay at the top while you search for more.
 */
export function UserPickerDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  confirmLabel,
  currentUserId,
  suggested,
  excludeIds = [],
  maxSelect,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle: string;
  confirmLabel: string;
  currentUserId: string | null;
  suggested: MessageUser[];
  excludeIds?: string[];
  maxSelect: number;
  onConfirm: (users: MessageUser[]) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MessageUser[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { results, isLoading } = useUserSearch(query, currentUserId, {
    limit: 20,
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setSelected([]);
    setError(null);
  }, [open]);

  const searching = query.trim() !== "";
  const pool = searching ? (results as MessageUser[]) : suggested;
  const selectedIds = new Set(selected.map((user) => user.id));
  const rows = [
    ...selected,
    ...pool.filter(
      (user) => !selectedIds.has(user.id) && !excludeIds.includes(user.id),
    ),
  ];
  const full = selected.length >= maxSelect;

  const toggle = (user: MessageUser) =>
    setSelected((previous) =>
      previous.some((item) => item.id === user.id)
        ? previous.filter((item) => item.id !== user.id)
        : full
          ? previous
          : [...previous, user],
    );

  const submit = async () => {
    if (selected.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(selected);
      onOpenChange(false);
    } catch (err) {
      setError(groupErrorMessage(err, selected));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[min(36rem,85dvh)] max-w-md flex-col gap-0 overflow-hidden p-0"
        showClose
      >
        <div className="shrink-0 px-5 pt-5 pb-3">
          <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
          <DialogDescription className="text-tertiary-text mt-1 text-sm">
            {subtitle}
          </DialogDescription>
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            aria-label="Search"
            autoComplete="off"
            spellCheck={false}
            className={cn(INPUT, "mt-4")}
          />
          <p className="text-tertiary-text mt-1.5 text-xs">
            {full
              ? `You can pick up to ${maxSelect} ${maxSelect === 1 ? "person" : "people"}.`
              : "Search for anyone by username."}
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
          {searching && isLoading && rows.length === 0 && (
            <p className="text-quaternary-text py-6 text-center text-xs">
              Searching…
            </p>
          )}
          {!isLoading && rows.length === 0 && (
            <p className="text-quaternary-text py-6 text-center text-xs">
              {searching
                ? "No users found."
                : "Search for someone to get started."}
            </p>
          )}
          {rows.map((user) => {
            const checked = selectedIds.has(user.id);
            const disabled = !checked && full;
            return (
              <label
                key={user.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors",
                  disabled
                    ? "opacity-50"
                    : "hover:bg-quaternary-bg cursor-pointer",
                )}
              >
                <UserAvatar
                  userId={user.id}
                  bgClassName="bg-tertiary-bg"
                  avatarHash={user.avatar}
                  username={user.username}
                  custom_avatar={user.custom_avatar}
                  size={8}
                  showBadge={false}
                  settings={user.settings_v2}
                  premiumType={user.premiumtype}
                />
                <span className="text-primary-text min-w-0 flex-1 truncate text-sm font-medium">
                  {getDisplayName(user)}
                </span>
                <Checkbox
                  checked={checked}
                  disabled={disabled}
                  onCheckedChange={() => toggle(user)}
                  className="h-5 w-5 rounded-md"
                  aria-label={getDisplayName(user)}
                />
              </label>
            );
          })}
        </div>
        {error && (
          <p role="alert" className="text-form-error px-5 pb-2 text-xs">
            {error}
          </p>
        )}
        <div className="border-border-primary flex shrink-0 gap-3 border-t px-5 py-4">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="flex-1"
            onClick={() => void submit()}
            disabled={submitting || selected.length === 0}
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Owner only. */
export function RenameGroupDialog({
  open,
  onOpenChange,
  group,
  onUpdated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: GroupChat;
  onUpdated: (group: GroupChat) => void;
}) {
  const [name, setName] = useState(group.name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(group.name);
    setError(null);
  }, [open, group.name]);

  const canSave = name.trim() !== "" && name.trim() !== group.name;
  const save = async () => {
    if (!canSave) return;
    setBusy(true);
    setError(null);
    try {
      onUpdated(await renameGroupChat(group.id, name.trim()));
      onOpenChange(false);
    } catch (err) {
      setError(groupErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit group name"
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => void save()}
            disabled={busy || !canSave}
          >
            Save
          </Button>
        </>
      }
    >
      <input
        autoFocus
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => event.key === "Enter" && void save()}
        maxLength={GROUP_NAME_MAX}
        placeholder="Group name"
        aria-label="Group name"
        className={INPUT}
      />
      {error && (
        <p role="alert" className="text-form-error text-xs">
          {error}
        </p>
      )}
    </AppDialog>
  );
}

/**
 * Opened from the X on the group's row. The owner can also delete it,
 * behind its own confirmation.
 */
export function LeaveGroupDialog({
  open,
  onOpenChange,
  group,
  currentUserId,
  onRemoved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: GroupChat;
  currentUserId: string | null;
  onRemoved: (groupId: string) => void;
}) {
  const isOwner = currentUserId !== null && group.ownerId === currentUserId;
  // The API hands ownership to the longest-standing remaining member.
  const nextOwnerId = group.memberIds.find((id) => id !== currentUserId);
  const { data: nextOwner } = useQuery({
    queryKey: ["message-users-batch", nextOwnerId ? [nextOwnerId] : []],
    queryFn: () => fetchMessageUsers([nextOwnerId!]),
    enabled: open && isOwner && !!nextOwnerId,
    staleTime: 5 * 60_000,
    retry: false,
    select: (users) => users[0],
  });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setConfirmDelete(false);
    setError(null);
  }, [open]);

  const run = async (action: "leave" | "delete") => {
    if (!currentUserId) return;
    setBusy(true);
    setError(null);
    try {
      if (action === "delete") await deleteGroupChat(group.id);
      else await removeGroupMember(group.id, currentUserId);
      onOpenChange(false);
      onRemoved(group.id);
    } catch (err) {
      setError(groupErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const groupName = (
    <span className="text-primary-text font-semibold">{group.name}</span>
  );

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={confirmDelete ? `Delete ${group.name}` : `Leave ${group.name}`}
      footer={
        <>
          {isOwner && !confirmDelete && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={busy}
              className="text-status-error mr-auto cursor-pointer text-sm font-medium hover:underline disabled:opacity-50"
            >
              Delete group
            </button>
          )}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              confirmDelete ? setConfirmDelete(false) : onOpenChange(false)
            }
            disabled={busy}
          >
            {confirmDelete ? "Back" : "Cancel"}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => void run(confirmDelete ? "delete" : "leave")}
            disabled={busy}
          >
            {confirmDelete ? "Delete Group" : "Leave Group"}
          </Button>
        </>
      }
    >
      <div className="text-secondary-text space-y-2 text-sm">
        {confirmDelete ? (
          <p>
            This deletes {groupName} and all of its messages for everyone. This
            can&apos;t be undone.
          </p>
        ) : (
          <>
            <p>
              Are you sure you want to leave {groupName}? You won&apos;t be able
              to rejoin unless someone invites you back.
            </p>
            {isOwner && nextOwnerId && (
              <p className="text-tertiary-text text-xs">
                You&apos;re the owner, so{" "}
                <span className="text-secondary-text font-semibold">
                  {nextOwner
                    ? getDisplayName(nextOwner)
                    : `User #${nextOwnerId.slice(-6)}`}
                </span>{" "}
                will become the owner.
              </p>
            )}
          </>
        )}
        {error && (
          <p role="alert" className="text-form-error text-xs">
            {error}
          </p>
        )}
      </div>
    </AppDialog>
  );
}
