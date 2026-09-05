"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { Icon } from "@/components/ui/IconWrapper";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/utils/ui/avatar";
import { cn } from "@/lib/utils";
import { Chat } from "@/components/chat/chat";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Spinner } from "@/components/ui/Spinner";
import { ChatEventTime } from "@/components/chat/chat-event";
import { useOptimizedRealTimeRelativeDate } from "@/hooks/useSharedTimer";
import { useAuthContext } from "@/contexts/AuthContext";
import { sanitizeText } from "@/utils/ui/sanitizeText";
import { useEmojiStringMap } from "@/hooks/useEmojiStringMap";
import {
  prepareEmojiShortcodeContentForApi,
  prepareEmojiShortcodeDisplayContent,
} from "@/utils/comments/emojiShortcodes";
import { useTwemoji } from "@/contexts/TwemojiContext";
import { MessageRow } from "@/components/Users/Messages/MessageRow";
import { ChatHeaderPanel } from "@/components/Users/Messages/ChatHeaderPanel";
import { ComposerFooter } from "@/components/Users/Messages/ComposerFooter";
import { ConversationSidebar } from "@/components/Users/Messages/ConversationSidebar";
import { NewConversationModal } from "@/components/Users/Messages/NewConversationModal";
import { OfferAcceptedBanner } from "@/components/Users/Messages/OfferAcceptedBanner";
import { useMessagesRealtime } from "@/hooks/useMessagesRealtime";
import { useConversationList } from "@/hooks/useConversationList";
import { useMessageThread } from "@/hooks/useMessageThread";
import { useSendMessage } from "@/hooks/useSendMessage";
import { useMessageMutations } from "@/hooks/useMessageMutations";
import { useMessageOffers } from "@/hooks/useMessageOffers";
import { useMessageBlocking } from "@/hooks/useMessageBlocking";
import { useLocalMessageOverlay } from "@/hooks/useLocalMessageOverlay";
import { useMessageNavigationScroll } from "@/hooks/useMessageNavigationScroll";
import { useUserSearch } from "@/hooks/useUserSearch";
import type {
  ConversationSummary,
  Message,
  MessageUser,
} from "@/utils/messages/types";
import { asId } from "@/utils/messages/parsing";
import { formatMessageText, getDisplayName } from "@/utils/messages/formatting";

export default function MessagesInbox() {
  const pathname = usePathname();
  const router = useRouter();

  const {
    user: currentUser,
    isAuthenticated,
    isLoading,
    setLoginModal,
    bans,
    setBan,
  } = useAuthContext();
  const messageBan = bans["communication"] ?? null;
  const emojiStringMap = useEmojiStringMap();
  const { twemojiEnabled } = useTwemoji();

  const prepareMessageContentForApi = useCallback(
    (text: string) =>
      sanitizeText(prepareEmojiShortcodeContentForApi(text.trim())),
    [],
  );

  /** Mirror backend emoji rendering in optimistic/local UI only. */
  const prepareMessageDisplayContent = useCallback(
    (text: string) =>
      sanitizeText(prepareEmojiShortcodeDisplayContent(text, emojiStringMap)),
    [emojiStringMap],
  );

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [totalConversations, setTotalConversations] = useState<number | null>(
    null,
  );
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editEmojiOpen, setEditEmojiOpen] = useState(false);
  const editCursorPosRef = useRef<number | null>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(
    null,
  );
  const [reportingMessage, setReportingMessage] = useState<Message | null>(
    null,
  );
  const [reportReason, setReportReason] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(
    null,
  );
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUnmessageable, setIsUnmessageable] = useState(false);
  const [blockedByMeByUserId, setBlockedByMeByUserId] = useState<
    Record<string, boolean>
  >({});
  const [currentUserEnriched, setCurrentUserEnriched] =
    useState<MessageUser | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [newConversationOpen, setNewConversationOpen] = useState(false);
  const userSearchInputRef = useRef<HTMLInputElement | null>(null);
  const [messagesPage, setMessagesPage] = useState(1);
  const [messagesTotalPages, setMessagesTotalPages] = useState<number | null>(
    null,
  );
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const messagesPageRef = useRef(1);
  const messagesTotalPagesRef = useRef<number | null>(null);
  const isLoadingOlderMessagesRef = useRef(false);

  const {
    routeConversationId,
    setRouteConversationId,
    selectedUserIdRef,
    routeConversationIdRef,
    messagesContainerRef,
    prependScrollRestoreRef,
    pendingOwnSendScrollRef,
  } = useMessageNavigationScroll({
    pathname,
    selectedUserId,
    setSelectedUserId,
    messages,
    currentUserId: currentUser ? asId(currentUser.id) : null,
    isLoadingMessages,
  });

  useEffect(() => {
    messagesPageRef.current = messagesPage;
  }, [messagesPage]);

  useEffect(() => {
    messagesTotalPagesRef.current = messagesTotalPages;
  }, [messagesTotalPages]);

  useEffect(() => {
    isLoadingOlderMessagesRef.current = isLoadingOlderMessages;
  }, [isLoadingOlderMessages]);

  useEffect(() => {
    setActiveMessageId(null);
  }, [selectedUserId]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("[data-message-row]")) return;
      setActiveMessageId(null);
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, []);
  const wsSendFallbackTimeoutsRef = useRef<Set<number>>(new Set());

  const insertEditEmoji = useCallback(
    (emoji: string, keepOpen = false) => {
      const cursor = editCursorPosRef.current ?? editContent.length;
      const next =
        editContent.slice(0, cursor) + emoji + editContent.slice(cursor);
      setEditContent(next);
      editCursorPosRef.current = cursor + emoji.length;
      if (!keepOpen) {
        setEditEmojiOpen(false);
        requestAnimationFrame(() => {
          const el = editTextareaRef.current;
          if (!el) return;
          el.focus();
          const pos = editCursorPosRef.current ?? next.length;
          el.setSelectionRange(pos, pos);
        });
      }
    },
    [editContent],
  );

  const {
    localThreadMessagesByUserIdRef,
    upsertLocalThreadMessage,
    updateLocalThreadMessage,
    removeLocalThreadMessage,
  } = useLocalMessageOverlay();

  const { isRealtimeConnected } = useMessagesRealtime({
    currentUserId: currentUser ? asId(currentUser.id) : null,
    isAuthenticated,
    selectedUserIdRef,
    wsSendFallbackTimeoutsRef,
    localThreadMessagesByUserIdRef,
    updateLocalThreadMessage,
    upsertLocalThreadMessage,
    removeLocalThreadMessage,
    setMessages,
    setConversations,
    setReplyingToMessage,
  });

  const selectedConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.user.id === selectedUserId,
      ),
    [conversations, selectedUserId],
  );

  const currentUserMessageUser = useMemo<MessageUser | null>(() => {
    if (!currentUser) return null;

    return {
      id: asId(currentUser.id),
      username: currentUser.username,
      global_name: currentUser.global_name,
      avatar: currentUser.avatar,
      banner: currentUser.banner,
      custom_banner: currentUser.custom_banner ?? null,
      accent_color: currentUser.accent_color ?? null,
      usernumber: currentUser.usernumber,
      flags: currentUser.flags,
      primary_guild: currentUser.primary_guild,
      premiumtype: currentUser.premiumtype,
      presence: currentUser.presence,
      last_seen: currentUser.last_seen,
      settings: currentUser.settings,
    };
  }, [currentUser]);

  const selectedUser = selectedConversation?.user ?? null;
  const currentUserId = currentUser ? asId(currentUser.id) : null;

  const {
    offerAcceptedEvents,
    visibleOfferAcceptedEvents,
    activeOfferAcceptedIndex,
    setActiveOfferAcceptedIndex,
    isOfferBannerMinimized,
    setIsOfferBannerMinimized,
    activeOfferDetailsStatus,
    activeOfferItems,
    canMarkOfferComplete,
    showOfferAcceptedBanner,
    isMarkingOfferComplete,
    setIsMarkingOfferComplete,
    getOfferDetailsKey,
    setOfferDetailsMap,
  } = useMessageOffers({
    messages,
    selectedUser,
    selectedUserId,
    currentUserId,
  });
  const lastSeenTime = useOptimizedRealTimeRelativeDate(
    selectedUser?.last_seen,
    `messages-last-seen-${selectedUser?.id ?? "none"}`,
  );

  const shouldHidePresence =
    selectedUser?.settings_v2?.hide_presence === true &&
    currentUser?.id !== selectedUser?.id;
  const isTargetOnline =
    !!selectedUser &&
    !shouldHidePresence &&
    selectedUser.presence?.status === "Online";
  const selectedUserBlockedByMe =
    !!selectedUser?.id && blockedByMeByUserId[selectedUser.id] === true;

  useConversationList({
    isAuthenticated,
    currentUserId,
    currentUserMessageUser,
    selectedUserId,
    routeConversationId,
    routeConversationIdRef,
    conversations,
    setConversations,
    setTotalConversations,
    setSelectedUserId,
    setIsLoadingConversations,
    setBlockedByMeByUserId,
    setCurrentUserEnriched,
  });
  const { results: userSearchResults, isLoading: isUserSearchLoading } =
    useUserSearch(userSearchQuery, currentUserId);
  useMessageThread({
    selectedUserId,
    currentUserId,
    isAuthenticated,
    isLoadingMessages,
    messagesContainerRef,
    messagesPageRef,
    messagesTotalPagesRef,
    isLoadingOlderMessagesRef,
    prependScrollRestoreRef,
    localThreadMessagesByUserIdRef,
    setMessages,
    setMessagesPage,
    setMessagesTotalPages,
    setIsLoadingMessages,
    setIsLoadingOlderMessages,
    setIsUnmessageable,
    upsertLocalThreadMessage,
  });
  const { handleBlockToggle, isProcessingBlockAction } = useMessageBlocking({
    setBlockedByMeByUserId,
  });
  const selectConversation = (id: string) => {
    setSelectedUserId(id);
    setRouteConversationId(id);
    window.history.pushState({}, "", `/messages/${encodeURIComponent(id)}`);
  };

  const goToConversationList = () => {
    setSelectedUserId(null);
    setRouteConversationId(null);
    setMessages([]);
    window.history.pushState({}, "", "/messages");
  };

  const { handleSendMessage } = useSendMessage({
    selectedUserId,
    selectedUser,
    currentUser,
    replyingToMessage,
    isSending,
    isRealtimeConnected,
    selectedUserIdRef,
    pendingOwnSendScrollRef,
    wsSendFallbackTimeoutsRef,
    prepareMessageContentForApi,
    prepareMessageDisplayContent,
    setIsSending,
    setMessages,
    setConversations,
    setReplyingToMessage,
    setBan,
    upsertLocalThreadMessage,
    updateLocalThreadMessage,
  });
  const {
    handleEditMessage,
    handleDeleteMessage,
    handleRetryFailedMessage,
    handleReportMessage,
  } = useMessageMutations({
    selectedUserId,
    messages,
    conversations,
    editContent,
    isSending,
    reportingMessage,
    reportReason,
    deletingMessageId,
    localThreadMessagesByUserIdRef,
    prepareMessageContentForApi,
    prepareMessageDisplayContent,
    handleSendMessage,
    setIsSending,
    setMessages,
    setConversations,
    setEditingMessageId,
    setEditContent,
    setDeletingMessageId,
    setReplyingToMessage,
    setReportingMessage,
    setReportReason,
    setIsSubmittingReport,
    setBan,
    updateLocalThreadMessage,
    removeLocalThreadMessage,
  });
  if (isLoading) {
    return (
      <div className="h-[calc(100dvh-5rem)] overflow-hidden px-4 pb-4">
        <div className="flex h-full min-h-0 flex-col">
          <Breadcrumb loading={true} containerClassName="py-4" />
          <div className="border-border-card bg-secondary-bg mt-0 flex min-h-0 flex-1 items-center justify-center rounded-lg border shadow-md">
            <p className="text-secondary-text text-sm">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="h-[calc(100dvh-5rem)] overflow-hidden px-4 pb-4">
        <div className="flex h-full min-h-0 flex-col">
          <Breadcrumb containerClassName="py-4" />
          <div className="border-border-card bg-secondary-bg mt-0 flex min-h-0 w-full flex-1 items-center justify-center rounded-lg border p-6 shadow-md sm:p-8">
            <div className="text-center">
              <h1 className="text-primary-text text-2xl font-bold">
                Direct Messages
              </h1>
              <p className="text-secondary-text mt-2 text-sm">
                Login to view your conversations and send messages.
              </p>
              <div className="mt-4">
                <Button onClick={() => setLoginModal({ open: true })}>
                  Login
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const messagePlaceholder = selectedUser
    ? `Message ${getDisplayName(selectedUser)}...`
    : "Select a conversation to start messaging.";

  return (
    <div className="h-[calc(100dvh-5rem)] overflow-hidden">
      <div className="flex h-full min-h-0 flex-col">
        <Breadcrumb containerClassName="px-4 py-4" />

        <div className="bg-secondary-bg border-border-card mx-4 mt-0 grid min-h-0 flex-1 grid-cols-1 overflow-hidden rounded-lg border lg:grid-cols-[320px_1fr]">
          <ConversationSidebar
            userSearchQuery={userSearchQuery}
            setUserSearchQuery={setUserSearchQuery}
            isUserSearchLoading={isUserSearchLoading}
            userSearchResults={userSearchResults}
            totalConversations={totalConversations}
            conversations={conversations}
            selectedUserId={selectedUserId}
            currentUserId={currentUserId}
            isLoadingConversations={isLoadingConversations}
            isAuthenticated={isAuthenticated}
            twemojiEnabled={twemojiEnabled}
            userSearchInputRef={userSearchInputRef}
            selectConversation={selectConversation}
          />

          <section
            className={cn(
              "min-h-0",
              selectedUserId ? "block" : "hidden lg:block",
            )}
          >
            {!selectedUser ? (
              <div className="flex h-full items-center justify-center p-6">
                <div className="text-center">
                  <div className="border-border-card bg-tertiary-bg/40 mx-auto flex h-24 w-24 items-center justify-center rounded-full border shadow-sm">
                    <Icon
                      icon="heroicons:paper-airplane"
                      className="text-secondary-text h-10 w-10"
                    />
                  </div>
                  <h2 className="text-primary-text mt-5 text-lg font-semibold">
                    Your messages
                  </h2>
                  <p className="text-secondary-text mt-1 text-sm">
                    Search for a user to start a chat.
                  </p>
                  <div className="mt-5 flex justify-center">
                    <Button onClick={() => setNewConversationOpen(true)}>
                      Start a conversation
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Chat className="h-full min-h-0">
                <ChatHeaderPanel
                  selectedUser={selectedUser}
                  currentUserId={currentUserId}
                  showOfferAcceptedBanner={showOfferAcceptedBanner}
                  isTargetOnline={isTargetOnline}
                  shouldHidePresence={shouldHidePresence}
                  lastSeenTime={lastSeenTime}
                  selectedUserBlockedByMe={selectedUserBlockedByMe}
                  isProcessingBlockAction={isProcessingBlockAction}
                  goToConversationList={goToConversationList}
                  onViewProfile={() =>
                    router.push(`/users/${encodeURIComponent(selectedUser.id)}`)
                  }
                  onToggleBlock={() =>
                    void handleBlockToggle(
                      selectedUser.id,
                      !selectedUserBlockedByMe,
                    )
                  }
                />

                <OfferAcceptedBanner
                  showOfferAcceptedBanner={showOfferAcceptedBanner}
                  selectedUser={selectedUser}
                  currentUserEnriched={currentUserEnriched}
                  visibleOfferAcceptedEvents={visibleOfferAcceptedEvents}
                  offerAcceptedEvents={offerAcceptedEvents}
                  activeOfferAcceptedIndex={activeOfferAcceptedIndex}
                  setActiveOfferAcceptedIndex={setActiveOfferAcceptedIndex}
                  activeOfferDetailsStatus={activeOfferDetailsStatus}
                  activeOfferItems={activeOfferItems}
                  isOfferBannerMinimized={isOfferBannerMinimized}
                  setIsOfferBannerMinimized={setIsOfferBannerMinimized}
                  canMarkOfferComplete={canMarkOfferComplete}
                  isMarkingOfferComplete={isMarkingOfferComplete}
                  setIsMarkingOfferComplete={setIsMarkingOfferComplete}
                  getOfferDetailsKey={getOfferDetailsKey}
                  setOfferDetailsMap={setOfferDetailsMap}
                />

                <ChatMessages
                  ref={messagesContainerRef}
                  className="bg-secondary-bg relative !flex-col px-2 py-3 sm:px-4"
                  style={{ overflowAnchor: "none" }}
                >
                  {!isLoadingMessages &&
                    isLoadingOlderMessages &&
                    messages.length > 0 && (
                      <div className="pointer-events-none absolute inset-x-0 top-2 z-10 flex justify-center">
                        <div className="bg-tertiary-bg border-border-card text-secondary-text flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
                          <Spinner className="h-3 w-3" />
                          Loading older messages
                        </div>
                      </div>
                    )}
                  {isLoadingMessages ? (
                    <div className="mx-auto my-auto flex flex-col items-center justify-center px-6 py-8 text-center">
                      <div className="border-border-card bg-tertiary-bg/40 flex h-14 w-14 items-center justify-center rounded-full border">
                        <Spinner className="h-6 w-6" />
                      </div>
                      <p className="text-secondary-text mt-3 text-sm">
                        Loading messages…
                      </p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="mx-auto my-auto w-full max-w-md px-4">
                      <div className="text-center">
                        <div className="border-border-card bg-tertiary-bg/40 mx-auto flex h-20 w-20 items-center justify-center rounded-full border shadow-sm">
                          <Icon
                            icon="ic:baseline-message"
                            className="text-secondary-text h-9 w-9"
                            inline={true}
                          />
                        </div>
                        <h3 className="text-primary-text mt-4 text-base font-semibold">
                          No messages yet
                        </h3>
                        <p className="text-secondary-text mt-1 text-sm">
                          Say hi to start the conversation.
                        </p>
                      </div>
                    </div>
                  ) : (
                    messages.map((message, index) => (
                      <MessageRow
                        key={message.id}
                        message={message}
                        index={index}
                        messages={messages}
                        currentUser={currentUser}
                        currentUserEnriched={currentUserEnriched}
                        currentUserMessageUser={currentUserMessageUser}
                        selectedUser={selectedUser}
                        activeMessageId={activeMessageId}
                        editingMessageId={editingMessageId}
                        editContent={editContent}
                        editEmojiOpen={editEmojiOpen}
                        emojiStringMap={emojiStringMap}
                        twemojiEnabled={twemojiEnabled}
                        isSending={isSending}
                        deletingMessageId={deletingMessageId}
                        editCursorPosRef={editCursorPosRef}
                        editTextareaRef={editTextareaRef}
                        messagesContainerRef={messagesContainerRef}
                        setActiveMessageId={setActiveMessageId}
                        setEditingMessageId={setEditingMessageId}
                        setEditContent={setEditContent}
                        setEditEmojiOpen={setEditEmojiOpen}
                        setReplyingToMessage={setReplyingToMessage}
                        setReportingMessage={setReportingMessage}
                        setReportReason={setReportReason}
                        handleDeleteMessage={handleDeleteMessage}
                        handleRetryFailedMessage={handleRetryFailedMessage}
                        handleEditMessage={handleEditMessage}
                        insertEditEmoji={insertEditEmoji}
                      />
                    ))
                  )}
                </ChatMessages>

                <ComposerFooter
                  messageBan={messageBan}
                  replyingToMessage={replyingToMessage}
                  setReplyingToMessage={setReplyingToMessage}
                  currentUser={currentUser}
                  currentUserEnriched={currentUserEnriched}
                  currentUserMessageUser={currentUserMessageUser}
                  selectedUser={selectedUser}
                  selectedUserId={selectedUserId}
                  messagePlaceholder={messagePlaceholder}
                  isSending={isSending}
                  isUnmessageable={isUnmessageable}
                  onSend={(message) => void handleSendMessage(message)}
                />
              </Chat>
            )}
          </section>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!deletingMessageId}
        onClose={() => setDeletingMessageId(null)}
        onConfirm={() =>
          deletingMessageId && void handleDeleteMessage(deletingMessageId, true)
        }
        title="Delete Message"
        confirmText="Delete"
        confirmVariant="destructive"
      >
        <div className="space-y-2">
          <p className="text-secondary-text">
            Are you sure you want to delete this message? This action cannot be
            undone.
          </p>
          <p className="text-secondary-text text-xs">
            Tip: Hold <span className="font-semibold">Shift</span> while
            clicking <span className="font-semibold">Delete Message</span> to
            skip this confirmation.
          </p>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        isOpen={!!reportingMessage}
        onClose={() => {
          setReportingMessage(null);
          setReportReason("");
        }}
        onConfirm={() => void handleReportMessage()}
        title="Report Message"
        confirmText="Submit Report"
        confirmVariant="destructive"
        confirmDisabled={!reportReason.trim() || isSubmittingReport}
        closeOnConfirm={false}
      >
        <div className="space-y-3">
          {reportingMessage && selectedUser && (
            <div className="border-border-card bg-tertiary-bg/50 rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div className="shrink-0">
                  <UserAvatar
                    userId={selectedUser.id}
                    avatarHash={selectedUser.avatar}
                    username={selectedUser.username}
                    custom_avatar={selectedUser.custom_avatar}
                    size={7}
                    showBadge={false}
                    settings={selectedUser.settings_v2}
                    premiumType={selectedUser.premiumtype}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2">
                    <span className="text-primary-text text-sm font-medium">
                      {getDisplayName(selectedUser)}
                    </span>
                    {typeof reportingMessage.createdAt === "number" && (
                      <ChatEventTime
                        timestamp={reportingMessage.createdAt}
                        format="discord"
                        className="text-secondary-text text-xs"
                      />
                    )}
                  </div>
                  <p className="text-primary-text/80 mt-0.5 line-clamp-4 text-sm break-words">
                    {formatMessageText(reportingMessage.content)}
                  </p>
                </div>
              </div>
            </div>
          )}
          <p className="text-secondary-text text-sm">
            Please describe why you are reporting this message.
          </p>
          <div>
            <textarea
              className="border-border-card bg-tertiary-bg text-primary-text placeholder:text-secondary-text focus:ring-border-focus w-full resize-none rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              rows={4}
              maxLength={500}
              placeholder="Explain why you're reporting this message..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            />
            <p
              className={`mt-1 text-right text-xs ${reportReason.length >= 500 ? "text-red-500" : "text-secondary-text"}`}
            >
              {reportReason.length}/500
            </p>
          </div>
        </div>
      </ConfirmDialog>

      <NewConversationModal
        open={newConversationOpen}
        onOpenChange={setNewConversationOpen}
        currentUserId={currentUserId}
        onSelectUser={(id) => {
          setNewConversationOpen(false);
          selectConversation(id);
        }}
      />
    </div>
  );
}
