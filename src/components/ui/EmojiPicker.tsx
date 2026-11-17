"use client";

import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import twemoji from "@twemoji/api";
import { Icon } from "@/components/ui/IconWrapper";
import { Spinner } from "@/components/ui/Spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFrequentEmojis } from "@/hooks/useFrequentEmojis";
import {
  loadEmojiData,
  searchEmojis,
  withSkinTone,
  type EmojiData,
  type EmojiEntry,
} from "@/utils/ui/emojiData";

const SKIN_TONE_KEY = "jbcl:emoji-skin-tone";
const TONE_SAMPLES = ["👏", "👏🏻", "👏🏼", "👏🏽", "👏🏾", "👏🏿"];
const toneListeners = new Set<() => void>();
let skinTone: number | null = null;

function readTone(): number {
  if (skinTone === null) {
    try {
      skinTone = Number(localStorage.getItem(SKIN_TONE_KEY)) || 0;
    } catch {
      skinTone = 0;
    }
  }
  return skinTone;
}

function setSkinTone(tone: number) {
  skinTone = tone;
  try {
    localStorage.setItem(SKIN_TONE_KEY, String(tone));
  } catch {
    // Not persisted when storage is blocked.
  }
  for (const listener of toneListeners) listener();
}

function useSkinTone() {
  return useSyncExternalStore(
    (listener) => {
      toneListeners.add(listener);
      return () => toneListeners.delete(listener);
    },
    readTone,
    () => 0,
  );
}

function Glyph({ emoji }: { emoji: string }) {
  const [failed, setFailed] = useState(false);
  let src: string | undefined;
  twemoji.parse(emoji, {
    callback: (icon) => {
      src = `${twemoji.base}${twemoji.size}/${icon}${twemoji.ext}`;
      return false;
    },
  });
  if (!src || failed) return <>{emoji}</>;
  return (
    // oxlint-disable-next-line next/no-img-element
    <img
      src={src}
      alt=""
      draggable={false}
      loading="lazy"
      className="pointer-events-none size-[1em]"
      onError={() => setFailed(true)}
    />
  );
}

interface Item {
  emoji: string;
  entry: EmojiEntry | undefined;
}

interface Section {
  key: string;
  label: string;
  icon: React.ReactNode;
  items: Item[];
}

const Grid = memo(function Grid({
  sections,
  disabled,
  onHover,
  onPick,
}: {
  sections: Section[];
  disabled: boolean;
  onHover: (item: Item) => void;
  onPick: (emoji: string, keepOpen: boolean) => void;
}) {
  return sections.map((section) => (
    <section key={section.key} data-section={section.key}>
      <h3 className="bg-primary-bg text-secondary-text sticky top-0 z-[1] px-1 pt-2 pb-1 text-xs font-semibold">
        {section.label}
      </h3>
      <div className="grid grid-cols-8 gap-0.5">
        {section.items.map((item) => (
          <button
            key={item.emoji}
            type="button"
            disabled={disabled}
            aria-label={`:${item.entry?.names[0] ?? item.emoji}:`}
            onPointerEnter={() => onHover(item)}
            onFocus={() => onHover(item)}
            onClick={(event) => onPick(item.emoji, event.shiftKey)}
            className="hover:bg-quaternary-bg focus-visible:outline-border-focus flex aspect-square cursor-pointer items-center justify-center rounded-md text-[1.6rem] outline-none focus-visible:outline-2 disabled:cursor-default disabled:opacity-50"
          >
            <Glyph emoji={item.emoji} />
          </button>
        ))}
      </div>
    </section>
  ));
});

export function EmojiPicker({
  quickEmojis,
  onSelect,
  disabled = false,
}: {
  quickEmojis: string[];
  onSelect: (emoji: string, keepOpen: boolean) => void;
  disabled?: boolean;
}) {
  const [data, setData] = useState<EmojiData | null>(null);
  const [error, setError] = useState(false);
  const frequent = useFrequentEmojis(quickEmojis, 16);
  const tone = useSkinTone();
  const [query, setQuery] = useState("");
  const [hovered, setHovered] = useState<Item | null>(null);
  const [toneOpen, setToneOpen] = useState(false);
  const [active, setActive] = useState("frequent");
  const scrollRef = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const [onPick] = useState(
    () => (emoji: string, keepOpen: boolean) =>
      onSelectRef.current(emoji, keepOpen),
  );

  useEffect(() => {
    let cancelled = false;
    loadEmojiData().then(
      (loaded) => !cancelled && setData(loaded),
      () => !cancelled && setError(true),
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const searching = Boolean(query.trim());
  const sections = useMemo((): Section[] => {
    if (!data) return [];
    if (searching) {
      const results = searchEmojis(data, query);
      return [
        {
          key: "search",
          label: results.length
            ? "Search results"
            : "No emoji match that search",
          icon: null,
          items: results.map((entry) => ({
            emoji: withSkinTone(entry, tone),
            entry,
          })),
        },
      ];
    }
    return [
      {
        key: "frequent",
        label: "Frequently Used",
        icon: <Icon icon="heroicons:clock" className="size-5" />,
        items: frequent.map((emoji) => ({
          emoji,
          entry: data.byEmoji.get(emoji),
        })),
      },
      ...data.groups.map((group) => ({
        key: group.key,
        label: group.label,
        icon: <Glyph emoji={group.icon} />,
        items: group.emojis.map((entry) => ({
          emoji: withSkinTone(entry, tone),
          entry,
        })),
      })),
    ];
  }, [data, searching, query, frequent, tone]);

  const jumpTo = (key: string) => {
    const container = scrollRef.current;
    const node = container?.querySelector<HTMLElement>(
      `[data-section="${key}"]`,
    );
    if (container && node) container.scrollTop = node.offsetTop;
    setActive(key);
  };

  const onScroll = () => {
    const container = scrollRef.current;
    if (!container || searching) return;
    let current = sections[0]?.key;
    for (const node of container.querySelectorAll<HTMLElement>(
      "[data-section]",
    )) {
      if (node.offsetTop <= container.scrollTop + 8)
        current = node.dataset.section ?? current;
    }
    if (current) setActive(current);
  };

  const shown = hovered ?? sections[0]?.items[0] ?? null;

  return (
    <div className="bg-primary-bg text-primary-text flex h-[min(26rem,70dvh)] w-[min(26rem,calc(100vw-2rem))] flex-col">
      <div className="border-border-card flex items-center gap-2 border-b p-3">
        <div className="relative min-w-0 flex-1">
          <Icon
            icon="heroicons:magnifying-glass"
            className="text-secondary-text pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
          />
          <input
            autoFocus
            type="text"
            value={query}
            disabled={disabled}
            onChange={(event) => {
              setQuery(event.target.value);
              setHovered(null);
              scrollRef.current?.scrollTo({ top: 0 });
            }}
            onKeyDown={(event) => {
              const first = sections[0]?.items[0];
              if (
                event.key === "Enter" &&
                !event.nativeEvent.isComposing &&
                searching &&
                first
              ) {
                event.preventDefault();
                if (!disabled) onSelect(first.emoji, event.shiftKey);
              }
            }}
            placeholder="Find the perfect emoji"
            aria-label="Search emoji"
            className="border-border-card bg-secondary-bg text-primary-text placeholder-secondary-text focus:border-border-focus h-9 w-full rounded-lg border py-2 pr-2 pl-8 text-sm outline-none"
          />
        </div>
        <div className="relative">
          <button
            type="button"
            aria-label="Choose skin tone"
            aria-expanded={toneOpen}
            onClick={() => setToneOpen((open) => !open)}
            className="hover:bg-quaternary-bg flex size-9 cursor-pointer items-center justify-center rounded-lg text-xl"
          >
            <Glyph emoji={TONE_SAMPLES[tone]} />
          </button>
          {toneOpen && (
            <div className="border-border-card bg-primary-bg absolute top-0 right-0 z-10 flex flex-col gap-0.5 rounded-lg border p-1 shadow-lg">
              {TONE_SAMPLES.map((sample, index) => (
                <button
                  key={sample}
                  type="button"
                  aria-label={
                    index ? `Skin tone ${index}` : "Default skin tone"
                  }
                  onClick={() => {
                    setSkinTone(index);
                    setToneOpen(false);
                  }}
                  className={`hover:bg-quaternary-bg flex size-8 cursor-pointer items-center justify-center rounded-md text-xl ${index === tone ? "bg-tertiary-bg" : ""}`}
                >
                  <Glyph emoji={sample} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {!searching && data && (
          <nav className="border-border-card bg-secondary-bg/50 flex w-12 shrink-0 flex-col items-center gap-1 overflow-y-auto border-r py-2">
            {sections.map((section) => (
              <Tooltip key={section.key}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={section.label}
                    onClick={() => jumpTo(section.key)}
                    className={`hover:bg-quaternary-bg flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-lg transition-all hover:grayscale-0 ${
                      active === section.key
                        ? "bg-tertiary-bg text-primary-text"
                        : "text-secondary-text grayscale"
                    }`}
                  >
                    {section.icon}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">{section.label}</TooltipContent>
              </Tooltip>
            ))}
          </nav>
        )}

        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-2"
        >
          {data ? (
            <Grid
              sections={sections}
              disabled={disabled}
              onHover={setHovered}
              onPick={onPick}
            />
          ) : (
            <div
              role="status"
              className="text-secondary-text flex h-full items-center justify-center gap-2 text-sm"
            >
              {error ? (
                "Couldn't load emoji."
              ) : (
                <>
                  <Spinner className="size-4" />
                  Loading emoji…
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="border-border-card bg-secondary-bg/50 flex h-12 shrink-0 items-center gap-2 border-t px-3">
        {shown && (
          <>
            <span className="text-2xl">
              <Glyph emoji={shown.emoji} />
            </span>
            <span className="text-primary-text truncate text-sm font-semibold">
              {shown.entry
                ? shown.entry.names.map((name) => `:${name}:`).join(" ")
                : shown.emoji}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
