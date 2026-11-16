"use client";

import { useCallback, useRef, useState } from "react";
import {
  EmojiPicker as Picker,
  type EmojiPickerListEmojiProps,
  type EmojiPickerListCategoryHeaderProps,
  type EmojiPickerListRowProps,
} from "frimousse";
import twemoji from "@twemoji/api";
import { Spinner } from "@/components/ui/Spinner";

function TwemojiImage({ emoji }: { emoji: string }) {
  const [failed, setFailed] = useState(false);
  let src: string | undefined;
  twemoji.parse(emoji, {
    callback: (icon) => {
      src = `${twemoji.base}${twemoji.size}/${icon}${twemoji.ext}`;
      return false;
    },
  });
  return (
    <span
      aria-hidden="true"
      className="flex size-6 shrink-0 items-center justify-center text-2xl leading-none"
    >
      {src && !failed ? (
        // oxlint-disable-next-line next/no-img-element
        <img
          src={src}
          alt=""
          width={24}
          height={24}
          draggable={false}
          className="pointer-events-none size-6 shrink-0"
          onError={() => setFailed(true)}
        />
      ) : (
        emoji
      )}
    </span>
  );
}

function CategoryHeader({
  category,
  ...props
}: EmojiPickerListCategoryHeaderProps) {
  return (
    <div
      {...props}
      className="bg-primary-bg text-secondary-text px-3 pt-3 pb-1.5 text-xs font-medium"
    >
      {category.label}
    </div>
  );
}

function Row(props: EmojiPickerListRowProps) {
  return <div {...props} className="scroll-my-1.5 px-2" />;
}

export default function EmojiPickerContent({
  twemojiEnabled,
  onSelect,
  disabled = false,
}: {
  twemojiEnabled: boolean;
  onSelect: (emoji: string, keepOpen: boolean) => void;
  disabled?: boolean;
}) {
  const shiftPressed = useRef(false);
  const Emoji = useCallback(
    ({ emoji, ...props }: EmojiPickerListEmojiProps) => (
      <button
        {...props}
        type="button"
        disabled={disabled}
        className="hover:bg-quaternary-bg data-[active]:bg-quaternary-bg focus-visible:outline-border-focus flex size-9 cursor-pointer items-center justify-center rounded-md text-xl outline-none focus-visible:outline-2 disabled:opacity-50"
      >
        {twemojiEnabled ? (
          <TwemojiImage key={emoji.emoji} emoji={emoji.emoji} />
        ) : (
          emoji.emoji
        )}
      </button>
    ),
    [disabled, twemojiEnabled],
  );

  return (
    <Picker.Root
      columns={8}
      emojiVersion={twemojiEnabled ? 17 : undefined}
      className="bg-primary-bg text-primary-text flex h-80 flex-col"
      onClickCapture={(event) => {
        shiftPressed.current = event.shiftKey;
      }}
      onKeyDownCapture={(event) => {
        shiftPressed.current = event.shiftKey;
      }}
      onEmojiSelect={({ emoji }) => {
        if (!disabled) onSelect(emoji, shiftPressed.current);
      }}
    >
      <div className="border-border-card flex items-center gap-2 border-b p-2">
        <Picker.Search
          autoFocus
          aria-label="Search emoji"
          placeholder="Search emoji…"
          disabled={disabled}
          className="border-border-card bg-tertiary-bg text-primary-text placeholder-secondary-text focus:border-border-focus h-9 min-w-0 flex-1 rounded-md border px-2.5 text-sm outline-none"
        />
        <Picker.SkinToneSelector
          aria-label="Choose skin tone"
          disabled={disabled}
          className="hover:bg-quaternary-bg focus-visible:outline-border-focus flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md text-xl outline-none focus-visible:outline-2"
        />
      </div>
      <Picker.Viewport className="relative min-h-0 flex-1 overscroll-contain outline-none">
        <Picker.Loading className="text-secondary-text absolute inset-0 flex items-center justify-center gap-2 text-sm">
          <Spinner className="size-4" />
          Loading emoji…
        </Picker.Loading>
        <Picker.Empty className="text-secondary-text absolute inset-0 flex items-center justify-center text-sm">
          No emoji found.
        </Picker.Empty>
        <Picker.List
          className="pb-2 select-none"
          components={{ CategoryHeader, Row, Emoji }}
        />
      </Picker.Viewport>
    </Picker.Root>
  );
}
