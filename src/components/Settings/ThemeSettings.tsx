"use client";

import { useId, useState, useSyncExternalStore } from "react";
import { LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
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
import { cn } from "@/lib/utils";
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
function ThemePreview({
  preview: p,
  compact,
}: {
  preview: Preview;
  compact?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex items-center justify-center",
        compact ? "h-12" : "h-20",
      )}
      style={{ background: p.page }}
    >
      <span className={cn("flex", compact ? "-space-x-1.5" : "-space-x-2")}>
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
                className={cn(
                  "rounded-full border-2",
                  compact ? "size-5" : "size-8",
                )}
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

type ThemeOption = (typeof THEME_OPTIONS)[number];

/** One theme's radio card: its colors above, its name below. */
function ThemeCard({
  option: { value, label, icon: ThemeIcon, preview },
  name,
  checked,
  onChange,
  compact,
}: {
  option: ThemeOption;
  name: string;
  checked: boolean;
  onChange: () => void;
  /** Smaller, for the All themes popover. */
  compact?: boolean;
}) {
  return (
    <label className="group border-border-card has-checked:border-button-info has-checked:ring-button-info/30 has-focus-visible:ring-border-focus hover:border-border-focus/60 flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border transition-[border-color,box-shadow] has-checked:ring-2 has-focus-visible:ring-2">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <ThemePreview preview={preview} compact={compact} />
      <span
        className={cn(
          // flex-1 so a short name's row still fills the card beside a wrapped one.
          "border-border-card group-has-checked:bg-button-info/10 flex flex-1 items-center gap-2 border-t",
          compact ? "min-h-10 px-2 py-1.5" : "min-h-14 px-3 py-2",
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {!compact && (
            <ThemeIcon
              aria-hidden="true"
              className="text-secondary-text size-4 shrink-0"
            />
          )}
          <span
            className={cn(
              "text-primary-text font-medium",
              compact ? "text-xs leading-tight" : "text-sm leading-tight",
            )}
          >
            {label}
          </span>
        </span>
        <span
          aria-hidden="true"
          className="border-border-card group-has-checked:border-button-info group-has-checked:bg-button-info ml-auto size-3.5 shrink-0 rounded-full border-2 transition-colors group-has-checked:shadow-[inset_0_0_0_2px_var(--color-secondary-bg)]"
        />
      </span>
    </label>
  );
}

/**
 * Every theme at once, as the same cards in a grid, so themes past the
 * carousel's edge aren't missed. Picking one also scrolls the carousel to it.
 */
function AllThemesPopover({
  name,
  theme,
  onPick,
  className,
  variant = "ghost",
}: {
  name: string;
  theme: string;
  onPick: (index: number) => void;
  className?: string;
  variant?: "ghost" | "secondary";
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant={variant} className={cn("gap-2", className)}>
          <LayoutGrid />
          All themes
          <span className="bg-button-info/15 text-link rounded-full px-1.5 text-xs leading-5 font-semibold tabular-nums">
            {THEME_OPTIONS.length}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="max-h-[70vh] w-[min(30rem,calc(100vw-2rem))] overflow-y-auto p-2"
      >
        <div
          role="radiogroup"
          aria-label="All themes"
          className="grid grid-cols-2 gap-2 p-1 sm:grid-cols-3"
        >
          {THEME_OPTIONS.map((option, index) => (
            <ThemeCard
              key={option.value}
              compact
              option={option}
              name={name}
              checked={theme === option.value}
              onChange={() => {
                onPick(index);
                setOpen(false);
              }}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
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
  const [carousel, setCarousel] = useState<CarouselApi>();
  const pickTheme = (index: number) => {
    setTheme(THEME_OPTIONS[index].value);
    carousel?.scrollTo(index);
  };

  return (
    <div className="space-y-6">
      <Carousel
        aria-labelledby={`${id}-label`}
        className="space-y-4"
        opts={{
          align: "start",
          dragFree: true,
          startIndex: THEME_OPTIONS.findIndex(({ value }) => value === theme),
        }}
        onKeyDownCapture={undefined}
        setApi={setCarousel}
      >
        <div className="grid grid-cols-[1fr_auto] items-center gap-x-4">
          <h3 id={`${id}-label`} className="text-primary-text font-medium">
            Theme
          </h3>
          <div className="col-start-2 row-start-1 flex gap-2 sm:row-span-2">
            <AllThemesPopover
              name={`${id}-theme-all`}
              theme={theme}
              onPick={pickTheme}
              className="hidden sm:inline-flex"
            />
            <CarouselPrevious
              variant="ghost"
              className="static translate-y-0"
              aria-label="Previous themes"
            />
            <CarouselNext
              variant="ghost"
              className="static translate-y-0"
              aria-label="Next themes"
            />
          </div>
          <p className="text-secondary-text col-span-2 mt-1 text-sm sm:col-span-1 sm:col-start-1 sm:row-start-2">
            Choose how the site looks.
            {isAuthenticated
              ? " Syncs with your account."
              : " Saved on this browser."}
          </p>
        </div>
        <CarouselContent
          role="radiogroup"
          aria-labelledby={`${id}-label`}
          className="-ml-3 py-1"
        >
          {THEME_OPTIONS.map((option) => (
            <CarouselItem
              key={option.value}
              className="basis-[85%] pl-3 sm:basis-[200px]"
            >
              <ThemeCard
                option={option}
                name={`${id}-theme`}
                checked={theme === option.value}
                onChange={() => setTheme(option.value)}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        {/* On mobile there's no room beside the arrows, so it goes here. */}
        <AllThemesPopover
          name={`${id}-theme-all-mobile`}
          theme={theme}
          onPick={pickTheme}
          variant="secondary"
          className="w-full sm:hidden"
        />
      </Carousel>

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
