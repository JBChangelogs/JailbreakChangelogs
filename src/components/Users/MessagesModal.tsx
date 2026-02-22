"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import { toast } from "sonner";
import { Icon } from "@/components/ui/IconWrapper";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/utils/avatar";
import { cn } from "@/lib/utils";
import { Chat } from "@/components/chat/chat";
import {
  ChatHeader,
  ChatHeaderAddon,
  ChatHeaderMain,
} from "@/components/chat/chat-header";
import { ChatMessages } from "@/components/chat/chat-messages";
import {
  ChatToolbar,
  ChatToolbarAddon,
  ChatToolbarButton,
  ChatToolbarTextarea,
} from "@/components/chat/chat-toolbar";
import {
  ChatEvent,
  ChatEventAddon,
  ChatEventBody,
  ChatEventContent,
  ChatEventTime,
  ChatEventTitle,
} from "@/components/chat/chat-event";
import { useOptimizedRealTimeRelativeDate } from "@/hooks/useSharedTimer";

type ModalUser = {
  id: string;
  username: string;
  global_name?: string;
  avatar: string;
  custom_avatar?: string;
  premiumtype?: number;
  presence?: {
    status: "Online" | "Offline";
    last_updated: number;
  };
  last_seen?: number | null;
  settings?: {
    avatar_discord: number;
    hide_presence?: number;
  };
};

type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt?: number;
};

type ApiThreadMessage = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at?: number;
};

type ApiThreadResponse = {
  items: ApiThreadMessage[];
  total: number;
  page: number;
  total_pages: number;
  size: number;
};

type ApiSendResponse = {
  success: boolean;
  message: {
    id: string;
    user_id: string;
    recipient_id: string;
    content: string;
  };
};

interface MessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: ModalUser | null;
  targetUser: ModalUser;
}

function getDisplayName(user: ModalUser): string {
  return user.global_name && user.global_name !== "None"
    ? user.global_name
    : user.username;
}

function normalizeTimestamp(timestamp: number): number {
  // API currently returns epoch seconds.
  return timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp;
}

function parseMessagesResponse(raw: string): ApiThreadResponse {
  // Preserve large snowflake-like IDs by stringifying ID fields before parse.
  const normalized = raw.replace(
    /"(id|sender_id|receiver_id|recipient_id|user_id)"\s*:\s*(\d{16,})/g,
    '"$1":"$2"',
  );
  return JSON.parse(normalized) as ApiThreadResponse;
}

export default function MessagesModal({
  isOpen,
  onClose,
  currentUser,
  targetUser,
}: MessagesModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draftMessage, setDraftMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const targetId = useMemo(() => targetUser.id, [targetUser.id]);
  const lastSeenTime = useOptimizedRealTimeRelativeDate(
    targetUser.last_seen,
    `messages-last-seen-${targetUser.id}`,
  );
  const shouldHidePresence =
    targetUser.settings?.hide_presence === 1 &&
    currentUser?.id !== targetUser.id;
  const isTargetOnline =
    !shouldHidePresence && targetUser.presence?.status === "Online";

  useEffect(() => {
    if (!isOpen || !currentUser) {
      setMessages([]);
      return;
    }

    let isCancelled = false;

    const fetchMessages = async () => {
      try {
        setIsLoading(true);

        const response = await fetch(`/api/messages/${targetId}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const rawBody = await response.text();

        if (!response.ok) {
          throw new Error("Failed to fetch conversations");
        }

        const data = parseMessagesResponse(rawBody);
        const threadItems = Array.isArray(data?.items) ? data.items : [];

        const mappedMessages: Message[] = threadItems.map((item) => ({
          id: item.id,
          senderId: item.sender_id,
          receiverId: item.receiver_id,
          content: item.content,
          createdAt:
            typeof item.created_at === "number"
              ? normalizeTimestamp(item.created_at)
              : undefined,
        }));

        if (!isCancelled) {
          setMessages(mappedMessages);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Error fetching conversations:", error);
          setMessages([]);
          toast.error("Failed to load messages");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchMessages();

    return () => {
      isCancelled = true;
    };
  }, [currentUser, isOpen, targetId]);

  const handleSendMessage = async () => {
    if (!currentUser) {
      toast.error("You need to be logged in to send messages");
      return;
    }

    const trimmedMessage = draftMessage.trim();
    if (!trimmedMessage) {
      return;
    }

    if (isSending) return;

    try {
      setIsSending(true);

      const response = await fetch(`/api/messages/${targetId}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: trimmedMessage }),
      });

      const rawBody = await response.text();
      const parsedBody = rawBody
        ? (JSON.parse(
            rawBody.replace(
              /"(id|sender_id|receiver_id|recipient_id|user_id)"\s*:\s*(\d{16,})/g,
              '"$1":"$2"',
            ),
          ) as ApiSendResponse)
        : null;

      if (!response.ok || !parsedBody?.success || !parsedBody.message) {
        throw new Error("Failed to send message");
      }

      const sentMessage: Message = {
        id: parsedBody.message.id,
        senderId: parsedBody.message.user_id,
        receiverId: parsedBody.message.recipient_id,
        content: parsedBody.message.content,
        createdAt: Date.now(),
      };

      setMessages((prev) => [sentMessage, ...prev]);
      setDraftMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-[1600]">
      <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-3 pt-20 sm:p-4">
        <DialogPanel className="border-border-card bg-secondary-bg flex h-[min(88dvh,720px)] max-h-[calc(100dvh-6rem)] w-full max-w-3xl flex-col overflow-hidden rounded-lg border shadow-lg">
          <Chat className="h-full">
            <ChatHeader className="border-border-card border-b px-4 py-3">
              <ChatHeaderAddon>
                <UserAvatar
                  userId={targetUser.id}
                  avatarHash={targetUser.avatar}
                  username={targetUser.username}
                  custom_avatar={targetUser.custom_avatar}
                  size={8}
                  isOnline={isTargetOnline}
                  showBadge={true}
                  onlineRingClassName="ring-2"
                  settings={targetUser.settings}
                  premiumType={targetUser.premiumtype}
                />
              </ChatHeaderAddon>
              <ChatHeaderMain>
                <div className="flex min-w-0 flex-col">
                  <p className="text-primary-text truncate text-sm font-semibold sm:text-base">
                    {getDisplayName(targetUser)}
                  </p>
                  {shouldHidePresence ? (
                    <p className="text-secondary-text truncate text-xs">
                      Last seen: Hidden
                    </p>
                  ) : isTargetOnline ? (
                    <p
                      className="truncate text-xs"
                      style={{ color: "var(--color-status-success-vibrant)" }}
                    >
                      Online
                    </p>
                  ) : targetUser.last_seen ? (
                    <p className="text-secondary-text truncate text-xs">
                      Last seen: {lastSeenTime}
                    </p>
                  ) : (
                    <p className="text-secondary-text truncate text-xs">
                      Last seen unavailable
                    </p>
                  )}
                </div>
              </ChatHeaderMain>
              <ChatHeaderAddon>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  aria-label="Close messages"
                >
                  <Icon
                    icon="material-symbols:close-rounded"
                    className="h-5 w-5"
                  />
                </Button>
              </ChatHeaderAddon>
            </ChatHeader>

            <ChatMessages className="bg-secondary-bg !flex-col px-2 py-3 sm:px-4">
              {isLoading ? (
                <div className="text-secondary-text bg-tertiary-bg/40 border-border-card mx-auto my-auto rounded-md border px-4 py-3 text-center text-sm">
                  Loading messages...
                </div>
              ) : messages.length === 0 ? (
                <div className="text-secondary-text bg-tertiary-bg border-border-card mx-auto my-auto rounded-md border px-4 py-3 text-center text-sm">
                  No messages yet. Start the conversation.
                </div>
              ) : (
                messages.map((message) => {
                  const isOwnMessage = message.senderId === currentUser?.id;
                  const sender =
                    isOwnMessage && currentUser ? currentUser : targetUser;

                  return (
                    <ChatEvent
                      key={message.id}
                      className={cn(
                        "items-start rounded-md py-1 transition-colors",
                        isOwnMessage ? "bg-tertiary-bg/25" : "",
                      )}
                    >
                      <ChatEventAddon>
                        <UserAvatar
                          userId={sender.id}
                          avatarHash={sender.avatar}
                          username={sender.username}
                          custom_avatar={sender.custom_avatar}
                          size={7}
                          showBadge={false}
                          settings={sender.settings}
                          premiumType={sender.premiumtype}
                        />
                      </ChatEventAddon>
                      <ChatEventBody>
                        <ChatEventTitle>
                          <span className="text-primary-text text-xs font-medium sm:text-sm">
                            {isOwnMessage ? "You" : getDisplayName(targetUser)}
                          </span>
                          {typeof message.createdAt === "number" && (
                            <ChatEventTime
                              timestamp={message.createdAt}
                              format="time"
                            />
                          )}
                        </ChatEventTitle>
                        <ChatEventContent className="text-primary-text break-words whitespace-pre-wrap">
                          {message.content}
                        </ChatEventContent>
                      </ChatEventBody>
                    </ChatEvent>
                  );
                })
              )}
            </ChatMessages>

            <ChatToolbar className="border-border-card [&>div]:border-border-card border-t p-3">
              <ChatToolbarTextarea
                value={draftMessage}
                onChange={(event) => setDraftMessage(event.target.value)}
                onSubmit={handleSendMessage}
                placeholder={`Message ${getDisplayName(targetUser)}...`}
                maxLength={1000}
              />
              <ChatToolbarAddon align="inline-end">
                <ChatToolbarButton
                  onClick={() => void handleSendMessage()}
                  aria-label="Send message"
                  disabled={!draftMessage.trim() || isSending}
                >
                  <Icon icon="heroicons:paper-airplane" className="h-4 w-4" />
                </ChatToolbarButton>
              </ChatToolbarAddon>
            </ChatToolbar>
          </Chat>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
