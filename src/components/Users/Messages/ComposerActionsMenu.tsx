"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChatToolbarButton } from "@/components/chat/chat-toolbar";
import { fetchSupporterGifts } from "@/services/settingsService";
import { fetchOwnMessageServers } from "@/services/messageInvitesService";
import type { SupporterGift } from "@/types/auth";
import type { OutgoingMessageMetadata } from "@/utils/messages/types";

interface ComposerActionsMenuProps {
  userId: string;
  recipientLabel: string;
  disabled: boolean;
  onSendGift: (gift: SupporterGift) => Promise<void>;
  onSend: (
    content: string,
    metadata?: OutgoingMessageMetadata,
  ) => void | Promise<void>;
}

export function ComposerActionsMenu({
  userId,
  recipientLabel,
  disabled,
  onSend,
  onSendGift,
}: ComposerActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"menu" | "servers" | "gifts">("menu");
  const [selectedGift, setSelectedGift] = useState<SupporterGift | null>(null);
  const giftInFlight = useRef(false);

  const queryClient = useQueryClient();
  const giftsKey = ["supporter-gifts", userId] as const;
  const serversQuery = useQuery({
    queryKey: ["own-private-servers", userId],
    queryFn: ({ signal }) => fetchOwnMessageServers(signal),
    enabled: open,
    staleTime: 60_000,
    retry: false,
  });
  const giftsQuery = useQuery({
    queryKey: giftsKey,
    queryFn: fetchSupporterGifts,
    enabled: open,
    staleTime: 30_000,
    retry: false,
  });
  const servers = serversQuery.data ?? null;
  const gifts = giftsQuery.data ?? null;
  const serversError = serversQuery.error?.message;
  const giftsError = giftsQuery.error?.message;
  const giftMutation = useMutation({
    retry: false,
    mutationFn: onSendGift,
    onSuccess: (_result, gift) => {
      queryClient.setQueryData<SupporterGift[]>(giftsKey, (previous) =>
        previous?.filter((item) => item.share_id !== gift.share_id),
      );
      void queryClient.invalidateQueries({ queryKey: giftsKey });
      setSelectedGift(null);
      setOpen(false);
      toast.success(`Gift sent to ${recipientLabel}.`);
    },
  });
  const sendingGift = giftMutation.isPending;

  const sendInvite = (content: string, metadata: OutgoingMessageMetadata) => {
    if (disabled || giftInFlight.current) return;
    setOpen(false);
    void onSend(content, metadata);
  };

  const sendGift = async () => {
    if (!selectedGift || disabled || giftInFlight.current) return;
    giftInFlight.current = true;
    try {
      await giftMutation.mutateAsync(selectedGift);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send gift");
    } finally {
      giftInFlight.current = false;
    }
  };

  const giftLevels = [...new Set(gifts?.map((gift) => gift.level))].sort(
    (a, b) => a - b,
  );
  const itemClass =
    "hover:bg-quaternary-bg flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm disabled:cursor-not-allowed disabled:opacity-50";
  const busy = disabled || sendingGift;

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        if (giftInFlight.current) return;
        setOpen(nextOpen);
        if (nextOpen) {
          setView("menu");
          setSelectedGift(null);
        }
      }}
    >
      <PopoverTrigger asChild>
        <ChatToolbarButton
          type="button"
          aria-label="More message options"
          disabled={busy}
          className="hover:bg-tertiary-bg! size-9! p-0! transition-colors [&_svg]:size-5!"
        >
          <Icon icon="heroicons:plus" className="h-4 w-4" />
        </ChatToolbarButton>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-72 max-w-[calc(100vw-2rem)] p-2"
      >
        {view !== "menu" && (
          <button
            type="button"
            className={itemClass}
            disabled={sendingGift}
            onClick={() => {
              setView("menu");
              setSelectedGift(null);
            }}
          >
            <Icon icon="heroicons:arrow-left" className="h-4 w-4" />
            Back
          </button>
        )}
        {view === "menu" && (
          <>
            <button
              type="button"
              className={itemClass}
              onClick={() => setView("servers")}
            >
              <Icon icon="lucide:server" className="h-4 w-4" />
              Send VIP Server
            </button>
            <button
              type="button"
              className={itemClass}
              onClick={() => setView("gifts")}
            >
              <Icon icon="heroicons:gift" className="h-4 w-4" />
              Send Gift
            </button>
          </>
        )}
        {view === "servers" && (
          <div className="max-h-72 overflow-y-auto">
            <p className="text-secondary-text px-2.5 py-2 text-xs font-semibold uppercase">
              Your VIP Servers
            </p>
            {serversError ? (
              <p role="alert" className="text-form-error px-2.5 py-2 text-xs">
                {serversError}
              </p>
            ) : servers === null ? (
              <p className="text-secondary-text px-2.5 py-2 text-xs">
                Loading…
              </p>
            ) : servers.length === 0 ? (
              <p className="text-secondary-text px-2.5 py-2 text-xs">
                You don&apos;t own any VIP servers to send. Add one on the
                Servers page first.
              </p>
            ) : (
              servers.map((server) => (
                <button
                  key={server.id}
                  type="button"
                  disabled={busy}
                  className={itemClass}
                  onClick={() =>
                    sendInvite(server.rules.trim() || "Here's my VIP server.", {
                      type: "vip_server_invite",
                      server_id: server.id,
                    })
                  }
                >
                  <Icon icon="lucide:server" className="h-4 w-4 shrink-0" />
                  <span className="min-w-0">
                    <span className="block">Server #{server.id}</span>
                    {server.rules && (
                      <span className="text-secondary-text block truncate text-xs">
                        {server.rules}
                      </span>
                    )}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
        {view === "gifts" && (
          <div className="max-h-72 overflow-y-auto">
            <p className="text-secondary-text px-2.5 py-2 text-xs font-semibold uppercase">
              Your Gifts
            </p>
            {giftsError ? (
              <p role="alert" className="text-form-error px-2.5 py-2 text-xs">
                {giftsError}
              </p>
            ) : gifts === null ? (
              <p className="text-secondary-text px-2.5 py-2 text-xs">
                Loading…
              </p>
            ) : gifts.length === 0 ? (
              <p className="text-secondary-text px-2.5 py-2 text-xs">
                You don&apos;t have any unredeemed supporter gifts to send.
              </p>
            ) : selectedGift ? (
              <div className="space-y-3 px-2.5 py-2">
                <p className="text-sm">
                  <Image
                    src={`https://assets.jailbreakchangelogs.com/assets/website_icons/jbcl_supporter_${selectedGift.level}.svg`}
                    alt=""
                    width={24}
                    height={24}
                    className="mb-2 object-contain"
                  />
                  Send a Supporter {selectedGift.level} gift to{" "}
                  <strong>{recipientLabel}</strong>?
                </p>
                <Button size="sm" disabled={busy} onClick={sendGift}>
                  {sendingGift ? "Sending…" : "Confirm Gift"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => setSelectedGift(null)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              giftLevels.map((level) => (
                <button
                  key={level}
                  type="button"
                  className={itemClass}
                  disabled={busy}
                  onClick={() =>
                    setSelectedGift(
                      gifts.find((gift) => gift.level === level) ?? null,
                    )
                  }
                >
                  <Image
                    src={`https://assets.jailbreakchangelogs.com/assets/website_icons/jbcl_supporter_${level}.svg`}
                    alt=""
                    width={24}
                    height={24}
                    className="shrink-0 object-contain"
                  />
                  <span className="flex-1">Supporter {level} Gift</span>
                  <span className="text-secondary-text text-xs">
                    ×{gifts.filter((gift) => gift.level === level).length}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
