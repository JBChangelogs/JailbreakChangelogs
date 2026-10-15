"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import CustomThemeControls, {
  CustomThemeMenu,
  customThemeOption,
  useCustomThemes,
} from "@/components/Settings/CustomThemeSettings";
import { setCustomTheme } from "@/utils/ui/customTheme";
import { getThemeEditor, subscribeThemeEditor } from "@/utils/ui/themeEditor";
import {
  getThemeCursorEnabled,
  setThemeCursorEnabled,
  subscribeThemeCursor,
} from "@/utils/ui/themeCursor";
import {
  getThemeShortcutHidden,
  setThemeShortcutHidden,
  subscribeThemeShortcut,
  type ThemeOption,
  type ThemePreview as Preview,
} from "@/utils/ui/themeOptions";

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

/** One theme's radio card: its colors above, its name below. */
export function ThemeCard({
  option: { value, label, icon, preview },
  name,
  checked,
  onChange,
  compact,
  badge,
}: {
  option: ThemeOption;
  name: string;
  checked: boolean;
  onChange: () => void;
  /** Marks a custom theme on its preview, e.g. "Custom" or "Shared". */
  badge?: string;
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
      <span className="relative block">
        <ThemePreview preview={preview} compact={compact} />
        {badge && (
          <span className="absolute top-1.5 left-1.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] leading-none font-semibold tracking-wide text-white uppercase">
            {badge}
          </span>
        )}
      </span>
      <span
        className={cn(
          // flex-1 so a short name's row still fills the card beside a wrapped one.
          "border-border-card group-has-checked:bg-button-info/10 flex flex-1 items-center gap-2 border-t",
          compact ? "min-h-10 px-2 py-1.5" : "min-h-14 px-3 py-2",
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {!compact && (
            <Icon
              icon={icon}
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

/** A card in the picker: a site theme, or a custom one with its menu. */
interface PickerItem {
  key: string;
  option: ThemeOption;
  checked: boolean;
  pick: () => void;
  /** Set on custom themes only. */
  badge?: string;
  menu?: React.ReactNode;
}

/**
 * Every theme at once in a side sheet, grouped into site and custom themes,
 * so themes past the carousel's edge aren't missed. It stays open on a pick,
 * so themes can be compared; the carousel scrolls to the pick if hidden.
 */
function AllThemesSheet({
  items,
  name,
  onPick,
  className,
  variant = "ghost",
}: {
  items: PickerItem[];
  name: string;
  onPick: (index: number) => void;
  className?: string;
  variant?: "ghost" | "secondary";
}) {
  const [open, setOpen] = useState(false);
  // Editing from here opens the editor sheet; this one closes so it doesn't
  // sit underneath, blocking the page the editor previews on.
  useEffect(
    () =>
      subscribeThemeEditor(() => {
        if (getThemeEditor()) setOpen(false);
      }),
    [],
  );

  return (
    <>
      <Button
        variant={variant}
        className={cn("gap-2", className)}
        onClick={() => setOpen(true)}
      >
        <Icon icon="lucide:layout-grid" aria-hidden="true" />
        All themes
        <span className="bg-button-info/15 text-link rounded-full px-1.5 text-xs leading-5 font-semibold tabular-nums">
          {items.length}
        </span>
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="bg-secondary-bg flex h-full w-full flex-col sm:max-w-lg">
          <SheetHeader className="shrink-0">
            <SheetTitle>All themes</SheetTitle>
            <SheetDescription className="text-secondary-text">
              Pick one to try it on the page.
            </SheetDescription>
          </SheetHeader>
          <div
            role="radiogroup"
            aria-label="All themes"
            className="-mx-1 min-h-0 flex-1 space-y-5 overflow-y-auto px-1 py-1"
          >
            {(
              [
                ["Site themes", false],
                ["Custom themes", true],
              ] as const
            ).map(([heading, isCustom]) => {
              const group = items
                .map((item, index) => ({ item, index }))
                .filter(({ item }) => !!item.badge === isCustom);
              if (!group.length) return null;
              return (
                <section key={heading}>
                  <h3 className="text-secondary-text mb-2 text-xs font-semibold tracking-wide uppercase">
                    {heading}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {group.map(({ item, index }) => (
                      <div key={item.key} className="relative">
                        <ThemeCard
                          option={item.option}
                          name={name}
                          checked={item.checked}
                          badge={item.badge}
                          onChange={() => onPick(index)}
                        />
                        {item.menu && (
                          <div className="absolute top-2 right-2">
                            {item.menu}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

/** Theme picker with previews, plus the header theme button setting. */
// A stable object: new options would make Embla re-initialize and jump.
const CAROUSEL_OPTIONS = { align: "start", dragFree: true } as const;

export default function ThemeSettings() {
  const id = useId();
  const { isAuthenticated } = useAuthContext();
  const { theme, setTheme, themes, customTheme } = useTheme();
  const custom = useCustomThemes();
  // Site themes, then a shared theme in use, then the user's own. No site
  // theme shows as picked while a custom theme draws over it.
  const allItems: PickerItem[] = [
    ...themes.map((option) => ({
      key: `site:${option.value}`,
      option,
      checked: !customTheme && theme === option.value,
      pick: () => setTheme(option.value),
    })),
    ...[
      ...(custom.sharedInUse ? [custom.sharedInUse] : []),
      ...custom.mine,
    ].map((t) => ({
      key: `custom:${t.share_code}`,
      option: customThemeOption(t),
      checked: customTheme?.share_code === t.share_code,
      pick: () => setCustomTheme(t),
      badge: t === custom.sharedInUse ? "Shared" : "Custom",
      menu: <CustomThemeMenu theme={t} custom={custom} />,
    })),
  ];
  const cursorEnabled = useSyncExternalStore(
    subscribeThemeCursor,
    getThemeCursorEnabled,
    () => false,
  );
  const shortcutHidden = useSyncExternalStore(
    subscribeThemeShortcut,
    getThemeShortcutHidden,
    () => false,
  );
  const [carousel, setCarousel] = useState<CarouselApi>();
  // The theme in use leads the carousel. It can resolve after mount, so the
  // lead follows it until the user picks; then the order stays put, so cards
  // don't jump and the other themes stay where they were.
  const userPickedRef = useRef(false);
  const checkedKey = allItems.find((item) => item.checked)?.key;
  const [leadKey, setLeadKey] = useState(checkedKey);
  useEffect(() => {
    if (!userPickedRef.current) setLeadKey(checkedKey);
  }, [checkedKey]);
  const lead = allItems.find((item) => item.key === leadKey);
  const items = lead
    ? [lead, ...allItems.filter((item) => item !== lead)]
    : allItems;
  const pickTheme = (index: number) => {
    userPickedRef.current = true;
    items[index].pick();
    // From the "All themes" sheet: only scroll if the theme is out of view.
    if (carousel && !carousel.slidesInView().includes(index)) {
      carousel.scrollTo(index);
    }
  };

  return (
    <div className="space-y-6">
      <Carousel
        aria-labelledby={`${id}-label`}
        className="space-y-4"
        opts={CAROUSEL_OPTIONS}
        verticalWheel
        onKeyDownCapture={undefined}
        setApi={setCarousel}
      >
        <div className="grid grid-cols-[1fr_auto] items-center gap-x-4">
          <h3 id={`${id}-label`} className="text-primary-text font-medium">
            Theme
          </h3>
          <div className="col-start-2 row-start-1 flex gap-2 sm:row-span-2">
            <AllThemesSheet
              items={items}
              name={`${id}-theme-all`}
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
        <CustomThemeControls custom={custom} />
        <CarouselContent
          role="radiogroup"
          aria-labelledby={`${id}-label`}
          className="-ml-3 py-1"
        >
          {items.map((item) => (
            <CarouselItem
              key={item.key}
              className="relative basis-[85%] pl-3 sm:basis-[200px]"
            >
              <ThemeCard
                option={item.option}
                name={`${id}-theme`}
                checked={item.checked}
                badge={item.badge}
                onChange={() => {
                  userPickedRef.current = true;
                  item.pick();
                }}
              />
              {/* Beside the card, not in it, so opening it doesn't pick the theme. */}
              {item.menu && (
                <div className="absolute top-2 right-2">{item.menu}</div>
              )}
            </CarouselItem>
          ))}
        </CarouselContent>
        {/* On mobile there's no room beside the arrows, so it goes here. */}
        <AllThemesSheet
          items={items}
          name={`${id}-theme-all-mobile`}
          onPick={pickTheme}
          variant="secondary"
          className="w-full sm:hidden"
        />
      </Carousel>

      {custom.dialogs}

      <div className="flex items-center justify-between gap-4">
        <div>
          <label
            htmlFor={`${id}-cursor`}
            className="text-primary-text font-medium"
          >
            Use theme cursor
          </label>
          <p className="text-secondary-text mt-1 text-sm">
            Match your cursor to your selected theme. Saved on this browser.
          </p>
        </div>
        <Switch
          id={`${id}-cursor`}
          checked={cursorEnabled}
          onCheckedChange={setThemeCursorEnabled}
        />
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
