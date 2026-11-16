"use client";

import { EmojiPicker } from "@/components/ui/EmojiPicker";

import * as React from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Icon } from "@/components/ui/IconWrapper";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { Spinner } from "@/components/ui/Spinner";
import { sanitizeText } from "@/utils/ui/sanitizeText";
import {
  ChatToolbarButton,
  ChatToolbarTextarea,
} from "@/components/chat/chat-toolbar";
import { useEmojiStringMap } from "@/hooks/useEmojiStringMap";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTwemoji } from "@/contexts/TwemojiContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { recordEmojiUse } from "@/hooks/useFrequentEmojis";
import { mentionsToIds } from "@/utils/messages/mentions";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  MAX_MESSAGE_IMAGES,
  MESSAGE_IMAGE_TYPES,
  uploadMessageImage,
  validateMessageImage,
} from "@/utils/messages/images";
import type {
  OutgoingMessageMetadata,
  MessageUser,
} from "@/utils/messages/types";

export interface MessageComposerProps {
  conversationId: string | null;
  placeholder: string;
  maxChars: number;
  isSending: boolean;
  disabled?: boolean;
  actions?: React.ReactNode;
  onSend: (
    message: string,
    metadata?: OutgoingMessageMetadata,
  ) => void | Promise<void>;
  onTyping?: () => void;
  /** Who @ can mention: a group's other members, or the other person. */
  mentionUsers?: MessageUser[];
}

const NO_USERS: MessageUser[] = [];

export function MessageComposer({
  conversationId,
  placeholder,
  maxChars,
  isSending,
  disabled = false,
  actions,
  onSend,
  onTyping,
  mentionUsers = NO_USERS,
}: MessageComposerProps) {
  const { user } = useAuthContext();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const uploadsRef = React.useRef<
    { id: string; name: string; controller: AbortController; url?: string }[]
  >([]);
  const [uploads, setUploads] = React.useState(uploadsRef.current);
  const syncUploads = () => setUploads([...uploadsRef.current]);
  const removeUpload = (id: string) => {
    uploadsRef.current.find((item) => item.id === id)?.controller.abort();
    uploadsRef.current = uploadsRef.current.filter((item) => item.id !== id);
    syncUploads();
  };
  const addImages = (files: File[]) => {
    if (disabled || isSending) return;
    if (uploadsRef.current.length + files.length > MAX_MESSAGE_IMAGES) {
      toast.info(
        "You can attach up to 4 images per message. Select fewer images.",
      );
      return;
    }
    for (const file of files) {
      try {
        validateMessageImage(file, user?.premiumtype ?? 0);
      } catch (error) {
        toast.error((error as Error).message);
        continue;
      }
      const item = {
        id: crypto.randomUUID(),
        name: file.name,
        controller: new AbortController(),
        url: undefined as string | undefined,
      };
      uploadsRef.current.push(item);
      syncUploads();
      void uploadMessageImage(file, item.controller.signal)
        .then((url) => {
          if (item.controller.signal.aborted) return;
          item.url = url;
          syncUploads();
        })
        .catch((error: unknown) => {
          if (item.controller.signal.aborted) return;
          removeUpload(item.id);
          toast.error(
            error instanceof Error ? error.message : "Failed to upload image.",
          );
        });
    }
  };
  const [dragState, setDragState] = React.useState<
    "images" | "unsupported" | null
  >(null);
  const addDroppedImages = React.useEffectEvent(addImages);
  React.useEffect(() => {
    let depth = 0;
    const isFileDrag = (event: DragEvent) =>
      event.dataTransfer?.types.includes("Files");
    const clear = () => {
      depth = 0;
      setDragState(null);
    };
    const over = (event: DragEvent) => {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      const unsupported = Array.from(event.dataTransfer?.items ?? []).some(
        (item) =>
          item.kind === "file" &&
          item.type &&
          !MESSAGE_IMAGE_TYPES.includes(item.type),
      );
      if (event.dataTransfer)
        event.dataTransfer.dropEffect =
          disabled || isSending || unsupported ? "none" : "copy";
      if (!disabled && !isSending)
        setDragState(unsupported ? "unsupported" : "images");
    };
    const enter = (event: DragEvent) => {
      if (!isFileDrag(event)) return;
      depth++;
      over(event);
    };
    const leave = () => {
      if (--depth <= 0) clear();
    };
    const drop = (event: DragEvent) => {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      clear();
      addDroppedImages(Array.from(event.dataTransfer?.files ?? []));
    };
    window.addEventListener("dragenter", enter);
    window.addEventListener("dragover", over);
    window.addEventListener("dragleave", leave);
    window.addEventListener("drop", drop);
    window.addEventListener("dragend", clear);
    window.addEventListener("blur", clear);
    return () => {
      clear();
      window.removeEventListener("dragenter", enter);
      window.removeEventListener("dragover", over);
      window.removeEventListener("dragleave", leave);
      window.removeEventListener("drop", drop);
      window.removeEventListener("dragend", clear);
      window.removeEventListener("blur", clear);
    };
  }, [conversationId, disabled, isSending]);
  const uploading = uploads.some((item) => !item.url);
  const [draft, setDraft] = React.useState("");
  const [emojiOpen, setEmojiOpen] = React.useState(false);
  const cursorPosRef = React.useRef<number | null>(null);
  const focusComposerAfterEmojiRef = React.useRef(false);
  const focusComposer = React.useCallback(() => {
    const textarea = inputRef.current?.parentElement?.querySelector("textarea");
    if (!textarea) return;
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    cursorPosRef.current = textarea.value.length;
  }, []);
  const emojiStringMap = useEmojiStringMap();
  const { twemojiEnabled } = useTwemoji();
  const isMobile = useMediaQuery("(max-width: 1023px)");

  React.useEffect(() => {
    setDraft("");
    uploadsRef.current = [];
    setUploads([]);
    return () => {
      uploadsRef.current.forEach((item) => item.controller.abort());
      uploadsRef.current = [];
    };
  }, [conversationId]);

  // What's sent: @username becomes <@id>, which is longer, so the limit
  // counts that.
  const outgoing = React.useMemo(
    () => mentionsToIds(draft, mentionUsers),
    [draft, mentionUsers],
  );
  const overLimit = React.useMemo(() => {
    const trimmed = outgoing.trim();
    if (!trimmed) return 0;
    return Math.max(0, sanitizeText(trimmed).length - maxChars);
  }, [outgoing, maxChars]);

  const submit = React.useCallback(() => {
    const trimmed = outgoing.trim();
    if ((!trimmed && !uploads.length) || uploading || isSending || disabled)
      return;

    const sanitized = sanitizeText(trimmed);
    if (sanitized.length > maxChars) {
      toast.error(`Message too long (max ${maxChars} characters).`);
      return;
    }

    const images = uploads.flatMap((item) => (item.url ? [item.url] : []));
    void onSend(
      outgoing,
      images.length ? { type: "images", images } : undefined,
    );
    uploadsRef.current = [];
    setUploads([]);
    setDraft("");
  }, [outgoing, disabled, isSending, maxChars, onSend, uploads, uploading]);

  const insertEmoji = React.useCallback(
    (emoji: string, keepOpen = false) => {
      const cursor = cursorPosRef.current ?? draft.length;
      const next = draft.slice(0, cursor) + emoji + draft.slice(cursor);
      setDraft(next);
      cursorPosRef.current = cursor + emoji.length;
      recordEmojiUse(emoji);
      if (!keepOpen) {
        focusComposerAfterEmojiRef.current = true;
        setEmojiOpen(false);
        requestAnimationFrame(focusComposer);
      }
    },
    [draft, focusComposer],
  );

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {dragState &&
        createPortal(
          <div
            className="pointer-events-none fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/70 p-6"
            role="status"
            aria-live="polite"
          >
            <div
              className={`bg-primary-bg text-primary-text flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center shadow-xl ${dragState === "unsupported" ? "border-button-danger" : "border-link"}`}
            >
              <Icon
                icon={
                  dragState === "unsupported"
                    ? "heroicons:no-symbol"
                    : "heroicons:photo"
                }
                className={`size-16 ${dragState === "unsupported" ? "text-button-danger" : "text-link"}`}
              />
              <p className="text-xl font-semibold">
                {dragState === "unsupported"
                  ? "File type not supported"
                  : "Drop images to attach"}
              </p>
              <p className="text-secondary-text text-sm">
                {dragState === "unsupported"
                  ? "Only PNG, JPG, WEBP or GIF images can be attached."
                  : "Add up to 4 images. You can add a message before sending."}
              </p>
            </div>
          </div>,
          document.body,
        )}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={MESSAGE_IMAGE_TYPES.join(",")}
        className="hidden"
        aria-label="Choose message images"
        onChange={(event) => {
          addImages(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />
      {uploads.length > 0 && (
        <div
          className="flex gap-3 overflow-x-auto px-3 pt-3 pb-3"
          aria-label="Image attachments"
          aria-live="polite"
        >
          {uploads.map((item) => (
            <div
              key={item.id}
              className="border-border-card bg-secondary-bg relative flex w-40 shrink-0 flex-col rounded-lg border p-2 sm:w-48"
            >
              {item.url ? (
                <Tooltip>
                  <ImageLightbox
                    src={item.url}
                    alt={item.name}
                    triggerAsChild
                    stopPropagation
                  >
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label={`Preview ${item.name}`}
                        className="flex h-28 w-full cursor-zoom-in items-center justify-center overflow-hidden rounded sm:h-32"
                      >
                        {/* oxlint-disable-next-line next/no-img-element */}
                        <img
                          src={item.url}
                          alt={item.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      </button>
                    </TooltipTrigger>
                  </ImageLightbox>
                  <TooltipContent>
                    Open preview · Images expire after 30 days
                  </TooltipContent>
                </Tooltip>
              ) : (
                <div className="text-secondary-text flex h-28 items-center justify-center gap-1 text-xs sm:h-32">
                  <Spinner className="size-4" />
                  Uploading…
                </div>
              )}
              <p
                className="text-secondary-text mt-2 truncate text-xs"
                title={item.name}
              >
                {item.name}
              </p>
              <button
                type="button"
                aria-label={`Remove ${item.name}`}
                onClick={() => removeUpload(item.id)}
                className="hover:bg-button-danger focus-visible:outline-border-focus absolute -top-2 -right-2 flex size-8 cursor-pointer items-center justify-center rounded-full border border-white/25 bg-black text-white shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <Icon icon="heroicons:x-mark" className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex min-w-0 items-center gap-2">
        {actions}
        <ChatToolbarTextarea
          onPaste={(event) => {
            const files = Array.from(event.clipboardData.files);
            if (!files.length) return;
            event.preventDefault();
            addImages(files);
          }}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            cursorPosRef.current = event.target.selectionStart;
            if (event.target.value.trim()) {
              onTyping?.();
            }
          }}
          onSubmit={submit}
          submitOnEnter={!isMobile}
          placeholder={placeholder}
          maxLength={1000}
          disabled={disabled}
          emojiMap={emojiStringMap}
          mentionUsers={mentionUsers}
          onEmojiPicked={recordEmojiUse}
          autoCorrect="off"
          autoComplete="off"
          spellCheck="false"
          autoCapitalize="off"
          rightOverlay={
            <div className="flex items-center">
              {overLimit > 0 ? (
                <span className="text-form-error text-xs font-medium tabular-nums">
                  -{overLimit}
                </span>
              ) : null}
              <ChatToolbarButton
                type="button"
                aria-label="Add images"
                onClick={() => inputRef.current?.click()}
                disabled={
                  disabled || isSending || uploads.length >= MAX_MESSAGE_IMAGES
                }
                className="hover:bg-tertiary-bg! size-11! p-0! lg:size-9!"
              >
                <Icon icon="heroicons:photo" className="size-5" />
              </ChatToolbarButton>
              <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
                <Tooltip delayDuration={500}>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <ChatToolbarButton
                        type="button"
                        aria-label="Open emoji picker"
                        disabled={disabled}
                        className="hover:bg-tertiary-bg! size-11! p-0! transition-colors lg:size-9! [&_svg]:size-5!"
                      >
                        <Icon icon="heroicons:face-smile" className="h-4 w-4" />
                      </ChatToolbarButton>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Add an emoji</TooltipContent>
                </Tooltip>
                <PopoverContent
                  align="end"
                  side="top"
                  sideOffset={8}
                  className="w-auto p-0"
                  onOpenAutoFocus={(e) => e.preventDefault()}
                  onCloseAutoFocus={(event) => {
                    if (!focusComposerAfterEmojiRef.current) return;
                    event.preventDefault();
                    focusComposerAfterEmojiRef.current = false;
                    focusComposer();
                  }}
                >
                  <EmojiPicker
                    quickEmojis={Object.values(emojiStringMap)}
                    twemojiEnabled={twemojiEnabled}
                    onSelect={insertEmoji}
                  />
                </PopoverContent>
              </Popover>
              <ChatToolbarButton
                onClick={submit}
                onPointerDown={(event) => event.preventDefault()}
                aria-label="Send message"
                className="hover:bg-tertiary-bg! size-11! p-0! transition-colors lg:size-9! [&_svg]:size-5!"
                disabled={
                  (!draft.trim() && !uploads.length) ||
                  uploading ||
                  isSending ||
                  disabled ||
                  overLimit > 0
                }
              >
                {isSending ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <Icon icon="heroicons:paper-airplane" className="h-4 w-4" />
                )}
              </ChatToolbarButton>
            </div>
          }
          // The app's text box: 16px on a 24px line with 8px padding, so one
          // line fills the 40px box and sits centred beside the "+".
          className={`text-primary-text placeholder-secondary-text py-2 pl-3 text-base leading-6 md:text-base ${overLimit > 0 ? "pr-48 lg:pr-44" : "pr-36 lg:pr-32"}`}
        />
      </div>
    </div>
  );
}
