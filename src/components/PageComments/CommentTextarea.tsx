"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
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

const AUTOCOMPLETE_DEBOUNCE_MS = 120;

type CommentTextareaProps = {
  value: string;
  onChange: (value: string) => void;
  emojiMap: EmojiStringMap;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  className?: string;
} & Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "value" | "onChange" | "onKeyDown"
>;

export const CommentTextarea = forwardRef<
  HTMLTextAreaElement,
  CommentTextareaProps
>(function CommentTextarea(
  { value, onChange, emojiMap, onKeyDown, className, ...props },
  ref,
) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autocompleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [autocompleteContext, setAutocompleteContext] =
    useState<ReturnType<typeof getEmojiAutocompleteContext>>(null);

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
  }, []);

  const runAutocomplete = useCallback(
    (text: string, cursor: number) => {
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
    [clearAutocomplete, emojiMap, emojiNames, hasEmojiMap],
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
      if (!autocompleteContext || suggestions.length === 0) return;
      const name = suggestions[index];
      if (!name) return;

      const { text, cursor } = applyEmojiSuggestion(
        value,
        autocompleteContext,
        name,
        emojiMap,
      );
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
      value,
      onChange,
      emojiMap,
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
    clearAutocomplete();
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestions.length > 0 && autocompleteContext) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex(
          (i) => (i - 1 + suggestions.length) % suggestions.length,
        );
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

  return (
    <div className="relative">
      {showPicker && (
        <div
          role="listbox"
          aria-label="Emoji suggestions"
          className="border-border-card bg-primary-bg absolute bottom-full left-0 z-20 mb-1 max-h-48 w-full min-w-[12rem] overflow-y-auto rounded-lg border shadow-lg"
        >
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
                  {emoji}
                </span>
                <span className="text-secondary-text font-mono text-xs">
                  :{name}:
                </span>
              </button>
            );
          })}
        </div>
      )}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onSelect={handleSelect}
        onKeyDown={handleKeyDown}
        onClick={handleSelect}
        className={className}
        {...props}
      />
    </div>
  );
});
