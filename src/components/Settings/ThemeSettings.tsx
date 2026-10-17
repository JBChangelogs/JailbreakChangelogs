"use client";

import { useEffect, useId, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import { Switch } from "@/components/ui/switch";
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
import {
  BOTTOM_PANEL_FOOTER_SPACE,
  BottomPanelFooter,
  useBottomPanel,
} from "@/components/ui/bottom-panel";
import { cn } from "@/lib/utils";
import {
  SETTING_HIGHLIGHT,
  SETTINGS_LIST,
} from "@/components/Settings/SettingsCard";
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
  /** Smaller, for the theme editor. */
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
  /** Wraps a custom theme's card with its menu (also on right-click). */
  wrap?: (card: React.ReactNode) => React.ReactNode;
}

const withMenu = (item: PickerItem, card: React.ReactNode) =>
  item.wrap ? item.wrap(card) : card;

/**
 * Every theme at once in a side sheet, grouped into site and custom themes.
 * It stays open on a pick, so themes can be compared on the page.
 */
function AllThemesSheet({
  items,
  name,
}: {
  items: PickerItem[];
  name: string;
}) {
  const [open, setOpen] = useState(false);
  // On phones, a bottom panel over the page, so picks show above it. It
  // opens tall enough for every theme (up to 92dvh, scrolling past that).
  const bottomPanel = useBottomPanel("themes", undefined, "content");
  const { isMobile } = bottomPanel;
  // An X in the corner on desktop; a full-width button pinned to the phone
  // footer, where a lone X reads oddly.
  const closeButton = isMobile ? (
    <Button variant="secondary" size="md" onClick={() => setOpen(false)}>
      Close
    </Button>
  ) : (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Close themes"
      onClick={() => setOpen(false)}
      className="absolute top-3 right-3"
    >
      <Icon icon="lucide:x" aria-hidden="true" />
    </Button>
  );
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
      {/* Primary: a preset is the easy way to change the look. */}
      <Button
        size="md"
        className="w-full sm:w-auto"
        onClick={() => setOpen(true)}
      >
        <Icon icon="lucide:palette" aria-hidden="true" />
        Change theme
      </Button>
      <Sheet open={open} onOpenChange={setOpen} modal={!isMobile}>
        <SheetContent
          side={bottomPanel.sheet.side}
          hideOverlay={isMobile}
          // The page stays usable under the panel; only the X closes it.
          onInteractOutside={
            isMobile ? (event) => event.preventDefault() : undefined
          }
          style={bottomPanel.sheet.style}
          className={cn(
            "bg-secondary-bg flex w-full flex-col gap-0 p-0",
            isMobile ? bottomPanel.sheet.className : "h-full sm:max-w-lg",
          )}
        >
          {isMobile ? (
            // No X up here: Close is in the footer, in thumb reach.
            <div className="shrink-0 px-4 pt-1 pb-3">
              {bottomPanel.handle}
              <SheetTitle className="truncate text-base">
                Choose a theme
              </SheetTitle>
              <SheetDescription className="sr-only">
                Pick one to try it on the page above.
              </SheetDescription>
            </div>
          ) : (
            <>
              {closeButton}
              <SheetHeader className="shrink-0 px-6 pt-6 pb-4">
                <SheetTitle>Choose a theme</SheetTitle>
                <SheetDescription className="text-secondary-text">
                  Pick one to try it on the page.
                </SheetDescription>
              </SheetHeader>
            </>
          )}
          <div
            role="radiogroup"
            aria-label="Themes"
            className={cn(
              "min-h-0 flex-1 space-y-5 overflow-y-auto pt-1",
              isMobile ? cn("px-4", BOTTOM_PANEL_FOOTER_SPACE) : "px-6 pb-6",
              bottomPanel.collapsed && "hidden",
            )}
          >
            {(
              [
                ["Site themes", false],
                ["Custom themes", true],
              ] as const
            ).map(([heading, isCustom]) => {
              const group = items.filter((item) => !!item.badge === isCustom);
              if (!group.length) return null;
              return (
                <section key={heading}>
                  <h3 className="text-secondary-text mb-2 text-xs font-semibold tracking-wide uppercase">
                    {heading}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {group.map((item) => (
                      <div key={item.key}>
                        {withMenu(
                          item,
                          <ThemeCard
                            option={item.option}
                            name={name}
                            checked={item.checked}
                            badge={item.badge}
                            onChange={item.pick}
                          />,
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
          {isMobile && (
            <BottomPanelFooter collapsed={bottomPanel.collapsed}>
              {closeButton}
            </BottomPanelFooter>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

/** Theme picker (in a sheet), plus the cursor and header button settings. */
export default function ThemeSettings() {
  const id = useId();
  const { isAuthenticated } = useAuthContext();
  const { theme, setTheme, themes, customTheme } = useTheme();
  const custom = useCustomThemes();
  // Site themes, then shared ones (in use, then recent), then the user's own. No site
  // theme shows as picked while a custom theme draws over it.
  const allItems: PickerItem[] = [
    ...themes.map((option) => ({
      key: `site:${option.value}`,
      option,
      checked: !customTheme && theme === option.value,
      pick: () => setTheme(option.value),
    })),
    ...[...custom.shared, ...custom.mine].map((t) => ({
      key: `custom:${t.share_code}`,
      option: customThemeOption(t),
      checked: customTheme?.share_code === t.share_code,
      pick: () => setCustomTheme(t),
      badge: custom.shared.includes(t) ? "Shared" : "Custom",
      wrap: (card: React.ReactNode) => (
        <CustomThemeMenu theme={t} custom={custom}>
          {card}
        </CustomThemeMenu>
      ),
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
  const current = allItems.find((item) => item.checked)?.option.label;

  return (
    <>
      <div className={SETTINGS_LIST}>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div className="min-w-0">
            <h3 className="text-primary-text font-medium">Theme</h3>
            <p className="text-secondary-text mt-1 text-sm">
              {current ? `Using ${current}.` : "Choose how the site looks."}
              {isAuthenticated
                ? " Syncs with your account."
                : " Saved on this browser."}
            </p>
          </div>
          <AllThemesSheet items={allItems} name={`${id}-theme`} />
        </div>
        <CustomThemeControls custom={custom} />

        <div
          className={cn(
            SETTING_HIGHLIGHT,
            "flex items-center justify-between gap-4",
          )}
        >
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

        <div
          className={cn(
            SETTING_HIGHLIGHT,
            "flex items-center justify-between gap-4",
          )}
        >
          <div>
            <label
              htmlFor={`${id}-shortcut`}
              className="text-primary-text font-medium"
            >
              Theme button in header
            </label>
            <p className="text-secondary-text mt-1 text-sm">
              Show a button in the header that opens these settings. Saved on
              this browser.
            </p>
          </div>
          <Switch
            id={`${id}-shortcut`}
            checked={!shortcutHidden}
            onCheckedChange={(show) => setThemeShortcutHidden(!show)}
          />
        </div>
      </div>
      {custom.dialogs}
    </>
  );
}
