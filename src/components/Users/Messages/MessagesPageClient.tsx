"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/Spinner";
import { useAuthContext } from "@/contexts/AuthContext";
import MessagesInbox from "@/components/Users/MessagesInbox";
import { GroupAvatar } from "./ConversationSidebar";
import {
  fetchGroupInvite,
  joinGroupInvite,
  GroupChatError,
} from "@/utils/api/groupChats";
import { groupInviteAppUrl } from "@/utils/messages/groupInvites";

function openApp(url: string) {
  try {
    window.location.href = url;
  } catch {}
}

export default function MessagesPageClient() {
  const params = useSearchParams();
  const code = params.get("invite");
  const appUrl = code === null ? null : groupInviteAppUrl(code);
  const useApp = params.get("app") === "true";
  const attempted = useRef<string | null>(null);

  useEffect(() => {
    if (!useApp || !appUrl || attempted.current === appUrl) return;
    attempted.current = appUrl;
    openApp(appUrl);
  }, [useApp, appUrl]);

  if (code === null) return <MessagesInbox />;
  return (
    <GroupInvitePage key={code} code={code} appUrl={useApp ? appUrl : null} />
  );
}

function inviteError(error: unknown): string {
  if (error instanceof GroupChatError) {
    if (error.code === "invite_not_found")
      return "This invite has expired or been revoked.";
    if (error.code === "group_full") return "This group is full.";
    if (error.code === "blocked")
      return "You can't join this group because you or a member have blocked each other.";
  }
  return error instanceof Error ? error.message : "Unable to load this invite.";
}

export function GroupInvitePage({
  code,
  appUrl,
}: {
  code: string;
  appUrl: string | null;
}) {
  const { user, isAuthenticated, isLoading, setLoginModal } = useAuthContext();
  const router = useRouter();
  const queryClient = useQueryClient();
  const valid = groupInviteAppUrl(code) !== null;
  const preview = useQuery({
    queryKey: ["group-invite", code, user?.id],
    queryFn: () => fetchGroupInvite(code),
    enabled: valid && isAuthenticated && !isLoading,
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const group = preview.data;
  const full = !!group && group.memberCount >= group.maxMembers;

  const join = async () => {
    if (joining || !group || !isAuthenticated) return;
    if (group.isMember) {
      router.push(`/messages/group/${encodeURIComponent(group.id)}`);
      return;
    }
    setJoining(true);
    setError(null);
    try {
      const joined = await joinGroupInvite(code);
      void queryClient.invalidateQueries({
        queryKey: ["group-chats", user?.id],
      });
      router.push(`/messages/group/${encodeURIComponent(joined.id)}`);
    } catch (err) {
      setError(inviteError(err));
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] items-center justify-center overflow-y-auto p-5">
      <div className="border-border-card bg-secondary-bg w-full max-w-xl space-y-6 rounded-xl border p-8 text-center sm:p-10">
        <h1 className="text-primary-text text-2xl font-semibold sm:text-3xl">
          Group invite
        </h1>
        {!valid ? (
          <p role="alert" className="text-form-error text-sm">
            This invite link is invalid.
          </p>
        ) : isLoading || (isAuthenticated && preview.isPending) ? (
          <div
            role="status"
            className="flex min-h-52 flex-col items-center justify-center gap-4 py-8"
          >
            <Spinner className="h-12 w-12" />
            <p className="text-secondary-text">Loading invite…</p>
          </div>
        ) : !isAuthenticated ? (
          <>
            <p className="text-secondary-text text-base">
              Sign in to preview and join this group.
            </p>
            <Button
              className="h-12 w-full max-w-xs text-base"
              onClick={() => setLoginModal({ open: true })}
            >
              Sign in
            </Button>
          </>
        ) : preview.isError ? (
          <>
            <p role="alert" className="text-form-error text-sm">
              {inviteError(preview.error)}
            </p>
            <Button variant="secondary" onClick={() => void preview.refetch()}>
              Retry
            </Button>
          </>
        ) : group ? (
          <div className="space-y-6 pt-4">
            <div className="flex justify-center">
              <GroupAvatar
                name={group.name}
                memberIds={group.memberIds}
                sizePx={64}
                className="h-16 w-16"
              />
            </div>
            <h2 className="text-primary-text text-2xl font-semibold break-words">
              {group.name}
            </h2>
            <p className="text-secondary-text text-base">
              {group.memberCount} / {group.maxMembers} members
            </p>
            <Button
              className="h-12 w-full max-w-xs text-base"
              disabled={joining || (full && !group.isMember)}
              onClick={() => void join()}
            >
              {joining
                ? "Joining…"
                : group.isMember
                  ? "Open group"
                  : full
                    ? "Group full"
                    : "Join group"}
            </Button>
            {error && (
              <p role="alert" className="text-form-error text-sm">
                {error}
              </p>
            )}
          </div>
        ) : null}
        {appUrl && (
          <div>
            <Button
              className="h-12 w-full max-w-xs text-base"
              variant="secondary"
              onClick={() => openApp(appUrl)}
            >
              Open in app
            </Button>
          </div>
        )}
        <Link
          href="/messages"
          className="text-link hover:text-link-hover block text-sm hover:underline"
        >
          Back to messages
        </Link>
      </div>
    </div>
  );
}
