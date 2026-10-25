"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  applyEmojiSuggestion,
  getEmojiAutocompleteContext,
  suggestEmojiShortcodes,
  transformEmojiShortcodes,
  type EmojiStringMap,
} from "@/utils/comments/emojiShortcodes";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/utils/ui/avatar";
import { getDisplayName } from "@/utils/messages/formatting";
import {
  splitDraftMentions,
  SUGGESTION_TRIGGER,
} from "@/utils/messages/mentions";
import type { MessageUser } from "@/utils/messages/types";
import { useTwemoji } from "@/contexts/TwemojiContext";
import Twemoji from "react-twemoji";

const AUTOCOMPLETE_DEBOUNCE_MS = 120;
const NO_USERS: MessageUser[] = [];

type CommentTextareaProps = {
  value: string;
  onChange: (value: string) => void;
  emojiMap: EmojiStringMap;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  className?: string;
  /** Who @ can mention; set to suggest and highlight mentions. */
  mentionUsers?: MessageUser[];
  /** An emoji accepted from the :shortcode suggestions. */
  onEmojiPicked?: (emoji: string) => void;
} & Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "value" | "onChange" | "onKeyDown"
>;

export const CommentTextarea = forwardRef<
  HTMLTextAreaElement,
  CommentTextareaProps
>(function CommentTextarea(
  {
    value,
    onChange,
    emojiMap,
    onKeyDown,
    className,
    mentionUsers = NO_USERS,
    onEmojiPicked,
    onScroll,
    ...props
  },
  ref,
) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const [mentionMatches, setMentionMatches] = useState<MessageUser[]>([]);
  const [mentionContext, setMentionContext] = useState<{
    query: string;
    replaceStart: number;
    replaceEnd: number;
  } | null>(null);
  const hasMentions = mentionUsers.length > 0;
  const autocompleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [autocompleteContext, setAutocompleteContext] =
    useState<ReturnType<typeof getEmojiAutocompleteContext>>(null);
  const { twemojiEnabled } = useTwemoji();

  useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement);

  const emojiNames = useMemo(() => Object.keys(emojiMap), [emojiMap]);
  const hasEmojiMap = emojiNames.length > 0;

  const clearAutocomplete = useCallback(() => {
    if (autocompleteTimerRef.current) {
      clearTimeout(autocompleteTimerRef.current);
      autocompleteTimerRef.current = null;
    }
    setSuggestions([]);
    setAutocompleteContext(null);
    setMentionMatches([]);
    setMentionContext(null);
  }, []);

  const runAutocomplete = useCallback(
    (text: string, cursor: number) => {
      const trigger = hasMentions
        ? SUGGESTION_TRIGGER.exec(text.slice(0, cursor))
        : null;
      if (trigger?.[1] === "@") {
        const query = trigger[2];
        const q = query.toLowerCase();
        const matches = mentionUsers
          .filter(
            (user) =>
              user.username.toLowerCase().startsWith(q) ||
              getDisplayName(user).toLowerCase().startsWith(q),
          )
          .slice(0, 8);
        setSuggestions([]);
        setAutocompleteContext(null);
        setMentionMatches(matches);
        setMentionContext(
          matches.length
            ? {
                query,
                replaceStart: cursor - query.length - 1,
                replaceEnd: cursor,
              }
            : null,
        );
        setActiveIndex(0);
        return;
      }
      setMentionMatches([]);
      setMentionContext(null);
      if (!hasEmojiMap || !text.includes(":")) {
        clearAutocomplete();
        return;
      }

      const context = getEmojiAutocompleteContext(text, cursor);
      if (!context) {
        clearAutocomplete();
        return;
      }

      const names = suggestEmojiShortcodes(text, cursor, emojiMap, emojiNames);
      setAutocompleteContext(context);
      setSuggestions(names);
      setActiveIndex(0);
    },
    [
      clearAutocomplete,
      emojiMap,
      emojiNames,
      hasEmojiMap,
      hasMentions,
      mentionUsers,
    ],
  );

  const scheduleAutocomplete = useCallback(
    (text: string, cursor: number) => {
      if (autocompleteTimerRef.current) {
        clearTimeout(autocompleteTimerRef.current);
      }
      autocompleteTimerRef.current = setTimeout(() => {
        autocompleteTimerRef.current = null;
        runAutocomplete(text, cursor);
      }, AUTOCOMPLETE_DEBOUNCE_MS);
    },
    [runAutocomplete],
  );

  useEffect(() => {
    return () => {
      if (autocompleteTimerRef.current) {
        clearTimeout(autocompleteTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!hasEmojiMap) {
      clearAutocomplete();
    }
  }, [hasEmojiMap, clearAutocomplete]);

  const applySuggestionAtIndex = useCallback(
    (index: number) => {
      let text: string;
      let cursor: number;
      const user = mentionContext ? mentionMatches[index] : undefined;
      if (mentionContext && user) {
        // The box shows a readable @username; sending turns it into an id.
        const mention = `@${user.username} `;
        text =
          value.slice(0, mentionContext.replaceStart) +
          mention +
          value.slice(mentionContext.replaceEnd);
        cursor = mentionContext.replaceStart + mention.length;
      } else {
        const name = suggestions[index];
        if (!autocompleteContext || !name) return;
        ({ text, cursor } = applyEmojiSuggestion(
          value,
          autocompleteContext,
          name,
          emojiMap,
        ));
        if (emojiMap[name]) onEmojiPicked?.(emojiMap[name]);
      }
      onChange(text);
      clearAutocomplete();

      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.focus();
        el.setSelectionRange(cursor, cursor);
      });
    },
    [
      autocompleteContext,
      suggestions,
      mentionContext,
      mentionMatches,
      value,
      onChange,
      emojiMap,
      onEmojiPicked,
      clearAutocomplete,
    ],
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const el = e.target;
    let next = el.value;
    const cursor = el.selectionStart ?? next.length;

    if (hasEmojiMap && next.includes(":")) {
      const transformed = transformEmojiShortcodes(next, emojiMap);
      if (transformed !== next) {
        const cursorDelta = transformed.length - next.length;
        next = transformed;
        onChange(next);
        requestAnimationFrame(() => {
          const nextCursor = Math.max(0, cursor + cursorDelta);
          el.setSelectionRange(nextCursor, nextCursor);
          scheduleAutocomplete(next, nextCursor);
        });
        return;
      }
      onChange(next);
      scheduleAutocomplete(next, cursor);
      return;
    }

    onChange(next);
    if (hasMentions && next.includes("@")) scheduleAutocomplete(next, cursor);
    else clearAutocomplete();
  };

  const handleSelect = () => {
    const el = textareaRef.current;
    if (!el) return;
    const cursor = el.selectionStart ?? value.length;
    if (autocompleteTimerRef.current) {
      clearTimeout(autocompleteTimerRef.current);
      autocompleteTimerRef.current = null;
    }
    runAutocomplete(value, cursor);
  };

  const suggestionCount = mentionContext
    ? mentionMatches.length
    : autocompleteContext
      ? suggestions.length
      : 0;
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestionCount > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % suggestionCount);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + suggestionCount) % suggestionCount);
        return;
      }
      if (e.key === "Tab" || (e.key === "Enter" && !e.shiftKey)) {
        e.preventDefault();
        applySuggestionAtIndex(activeIndex);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        clearAutocomplete();
        return;
      }
    }

    onKeyDown?.(e);
  };

  const showPicker = suggestions.length > 0 && hasEmojiMap;
  const popupOpen =
    (showPicker && !!autocompleteContext) ||
    (!!mentionContext && mentionMatches.length > 0);

  // In a chat composer the popup spans the whole composer box (marked with
  // data-suggestions-anchor) and sits just above it, like the app.
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>();
  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    const wrapper = textarea?.parentElement;
    const anchor = textarea?.closest("[data-suggestions-anchor]");
    if (!popupOpen || !wrapper || !anchor) {
      setPopupStyle(undefined);
      return;
    }
    const box = wrapper.getBoundingClientRect();
    const target = anchor.getBoundingClientRect();
    setPopupStyle({
      left: target.left - box.left,
      width: target.width,
      bottom: box.bottom - target.top + 8,
      marginBottom: 0,
    });
  }, [popupOpen, value]);

  return (
    <div className="relative">
      {mentionContext && mentionMatches.length > 0 && (
        <div
          role="listbox"
          aria-label="Member suggestions"
          className="border-border-card bg-primary-bg absolute bottom-full left-0 z-20 mb-1 flex max-h-56 w-full min-w-[12rem] flex-col overflow-hidden rounded-lg border shadow-lg"
          style={popupStyle}
        >
          <p
            className="text-secondary-text border-border-card shrink-0 border-b px-3 py-2 text-[11px] font-semibold tracking-wide uppercase"
            aria-hidden
          >
            Members matching @{mentionContext.query}
          </p>
          <div className="max-h-48 overflow-y-auto">
            {mentionMatches.map((user, index) => (
              <button
                key={user.id}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                  index === activeIndex
                    ? "bg-quaternary-bg"
                    : "hover:bg-quaternary-bg/70",
                )}
                onMouseDown={(e) => {
                  e.preventDefault();
                  applySuggestionAtIndex(index);
                }}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <UserAvatar
                  userId={user.id}
                  bgClassName="bg-tertiary-bg"
                  avatarHash={user.avatar}
                  username={user.username}
                  custom_avatar={user.custom_avatar}
                  size={6}
                  showBadge={false}
                  settings={user.settings_v2}
                  premiumType={user.premiumtype}
                />
                <span className="text-primary-text truncate">
                  {getDisplayName(user)}
                </span>
                <span className="text-tertiary-text truncate text-xs">
                  {user.username}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      {hasMentions && (
        // The text again, behind the transparent textarea, so mentions can
        // be highlighted in place. Same padding, size and line height, and
        // no padding or weight on the highlights, or the text drifts.
        <div
          ref={mirrorRef}
          aria-hidden
          className={cn(
            className,
            "text-primary-text pointer-events-none absolute inset-0 h-full max-h-none min-h-0 overflow-hidden wrap-break-word whitespace-pre-wrap",
          )}
        >
          {splitDraftMentions(value, mentionUsers).map((part, index) =>
            index % 2 ? (
              <span
                key={index}
                className="bg-button-info/30 rounded-[3px] text-[color-mix(in_srgb,var(--color-button-info)_25%,white)]"
              >
                {part}
              </span>
            ) : (
              part
            ),
          )}
          {/* Gives a trailing newline its height. */}
          {"\u200b"}
        </div>
      )}
      {showPicker && autocompleteContext && (
        <div
          role="listbox"
          aria-label="Emoji suggestions"
          className="border-border-card bg-primary-bg absolute bottom-full left-0 z-20 mb-1 flex max-h-56 w-full min-w-[12rem] flex-col overflow-hidden rounded-lg border shadow-lg"
          style={popupStyle}
        >
          <p
            className="text-secondary-text border-border-card shrink-0 border-b px-3 py-2 text-[11px] font-semibold tracking-wide uppercase"
            aria-hidden
          >
            Emojis matching :{autocompleteContext.query}
          </p>
          <div className="max-h-48 overflow-y-auto">
            {suggestions.slice(0, 8).map((name, index) => {
              const emoji = emojiMap[name];
              return (
                <button
                  key={name}
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  className={cn(
                    "text-primary-text flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                    index === activeIndex
                      ? "bg-quaternary-bg"
                      : "hover:bg-quaternary-bg/70",
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applySuggestionAtIndex(index);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center text-lg leading-none">
                    {twemojiEnabled ? (
                      <Twemoji tag="span" options={{ className: "twemoji" }}>
                        {emoji}
                      </Twemoji>
                    ) : (
                      emoji
                    )}
                  </span>
                  <span className="text-secondary-text text-xs">:{name}:</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onSelect={handleSelect}
        onKeyDown={handleKeyDown}
        onClick={handleSelect}
        onScroll={(e) => {
          if (mirrorRef.current)
            mirrorRef.current.scrollTop = e.currentTarget.scrollTop;
          onScroll?.(e);
        }}
        className={cn(
          className,
          hasMentions && "caret-primary-text relative text-transparent",
        )}
        {...props}
      />
    </div>
  );
});
