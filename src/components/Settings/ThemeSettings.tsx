"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Check, ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  getThemeShortcutHidden,
  setThemeShortcutHidden,
  subscribeThemeShortcut,
  THEME_OPTIONS,
} from "@/utils/ui/themeOptions";

type Preview = (typeof THEME_OPTIONS)[number]["preview"];

/**
 * The theme's colors: dots for its main colors on its page background, each
 * named in a tooltip. Hidden from screen readers; the label names the theme.
 */
function ThemePreview({ preview: p }: { preview: Preview }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-20 items-center justify-center"
      style={{ background: p.page }}
    >
      <span className="flex -space-x-2">
        {(
          [
            ["Cards", p.card],
            ["Secondary text", p.muted],
            ["Text", p.text],
            ["Buttons", p.button],
            ["Links", p.link],
          ] as const
        ).map(([use, color]) => (
          <Tooltip key={use}>
            <TooltipTrigger asChild>
              <span
                className="size-8 rounded-full border-2"
                style={{
                  background: color,
                  borderColor: p.page,
                  // Outlined so colors close to the background still show.
                  outline: `1px solid color-mix(in srgb, ${p.text} 25%, transparent)`,
                }}
              />
            </TooltipTrigger>
            <TooltipContent>{use}</TooltipContent>
          </Tooltip>
        ))}
      </span>
    </span>
  );
}

/** Theme picker with previews, plus the header theme button setting. */
export default function ThemeSettings() {
  const id = useId();
  const { isAuthenticated } = useAuthContext();
  const { theme, setTheme } = useTheme();
  const shortcutHidden = useSyncExternalStore(
    subscribeThemeShortcut,
    getThemeShortcutHidden,
    () => false,
  );
  const railRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState({ prev: false, next: false });
  const [listOpen, setListOpen] = useState(false);

  const updateCanScroll = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    setCanScroll({
      prev: rail.scrollLeft > 1,
      next: rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 1,
    });
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const observer = new ResizeObserver(updateCanScroll);
    observer.observe(rail);
    return () => observer.disconnect();
  }, [updateCanScroll]);

  // Bring the chosen theme fully into view, e.g. one past the edge on load or
  // a partly shown one that was just clicked.
  useEffect(() => {
    const rail = railRef.current;
    const card = rail?.querySelector<HTMLElement>("label:has(:checked)");
    if (!rail || !card) return;
    const start = card.offsetLeft;
    const end = start + card.offsetWidth;
    if (start < rail.scrollLeft || end > rail.scrollLeft + rail.clientWidth) {
      rail.scrollTo({ left: start, behavior: "smooth" });
    }
  }, [theme]);

  const scrollRail = (direction: 1 | -1) => {
    const rail = railRef.current;
    rail?.scrollBy({
      left: direction * rail.clientWidth * 0.8,
      behavior: "smooth",
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div>
          <h3 id={`${id}-label`} className="text-primary-text font-medium">
            Theme
          </h3>
          <p className="text-secondary-text mt-1 text-sm">
            Choose how the site looks.
            {isAuthenticated
              ? " Syncs with your account."
              : " Saved on this browser."}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {/* Lists every theme at once, so ones past the edge aren't missed. */}
          <Popover open={listOpen} onOpenChange={setListOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm">
                <LayoutGrid />
                All themes ({THEME_OPTIONS.length})
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-60 p-1">
              <ul>
                {THEME_OPTIONS.map(({ value, label, preview }) => (
                  <li key={value}>
                    <button
                      type="button"
                      aria-pressed={theme === value}
                      onClick={() => {
                        setTheme(value);
                        setListOpen(false);
                      }}
                      className="text-primary-text hover:bg-tertiary-bg focus-visible:ring-border-focus flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm focus-visible:ring-2 focus-visible:outline-none"
                    >
                      <span
                        aria-hidden="true"
                        className="flex size-6 shrink-0 items-center justify-center rounded-full border"
                        style={{
                          background: preview.page,
                          borderColor: preview.card,
                        }}
                      >
                        <span
                          className="size-3 rounded-full"
                          style={{ background: preview.button }}
                        />
                      </span>
                      {label}
                      {theme === value && (
                        <Check
                          aria-hidden="true"
                          className="text-link ml-auto size-4"
                        />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </PopoverContent>
          </Popover>
          {(canScroll.prev || canScroll.next) && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="size-8!"
                disabled={!canScroll.prev}
                onClick={() => scrollRail(-1)}
                aria-label="Previous themes"
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8!"
                disabled={!canScroll.next}
                onClick={() => scrollRail(1)}
                aria-label="Next themes"
              >
                <ChevronRight />
              </Button>
            </>
          )}
        </div>
      </div>

      <div
        role="radiogroup"
        aria-labelledby={`${id}-label`}
        ref={railRef}
        onScroll={updateCanScroll}
        // Card widths leave the next card peeking out, so it's clear there are
        // more themes to scroll to. Padding keeps the focus rings unclipped.
        className="scrollbar-hide relative -m-1 grid snap-x snap-mandatory scroll-px-1 auto-cols-[44%] grid-flow-col gap-3 overflow-x-auto p-1 sm:auto-cols-[30%] lg:auto-cols-[22%]"
      >
        {THEME_OPTIONS.map(({ value, label, icon: ThemeIcon, preview }) => (
          <label
            key={value}
            className="group border-border-card has-checked:border-button-info has-checked:ring-button-info/30 has-focus-visible:ring-border-focus hover:border-border-focus/60 cursor-pointer snap-start overflow-hidden rounded-xl border transition-[border-color,box-shadow] has-checked:ring-2 has-focus-visible:ring-2"
          >
            <input
              type="radio"
              name={`${id}-theme`}
              value={value}
              checked={theme === value}
              onChange={() => setTheme(value)}
              className="sr-only"
            />
            <ThemePreview preview={preview} />
            <span className="border-border-card group-has-checked:bg-button-info/10 flex items-center gap-2 border-t px-3 py-2">
              <ThemeIcon
                aria-hidden="true"
                className="text-secondary-text size-4 shrink-0"
              />
              <span className="text-primary-text text-sm font-medium">
                {label}
              </span>
              <span
                aria-hidden="true"
                className="border-border-card group-has-checked:border-button-info group-has-checked:bg-button-info ml-auto size-3.5 shrink-0 rounded-full border-2 transition-colors group-has-checked:shadow-[inset_0_0_0_2px_var(--color-secondary-bg)]"
              />
            </span>
          </label>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <label
            htmlFor={`${id}-shortcut`}
            className="text-primary-text font-medium"
          >
            Theme button in header
          </label>
          <p className="text-secondary-text mt-1 text-sm">
            Show a button in the header that opens these settings. Saved on this
            browser.
          </p>
        </div>
        <Switch
          id={`${id}-shortcut`}
          checked={!shortcutHidden}
          onCheckedChange={(show) => setThemeShortcutHidden(!show)}
        />
      </div>
    </div>
  );
}
