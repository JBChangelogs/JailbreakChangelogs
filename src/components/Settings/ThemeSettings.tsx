"use client";

import { useId, useSyncExternalStore } from "react";
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

  return (
    <div className="space-y-5">
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

      <div
        role="radiogroup"
        aria-labelledby={`${id}-label`}
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        {THEME_OPTIONS.map(({ value, label, icon: ThemeIcon, preview }) => (
          <label
            key={value}
            className="group border-border-card has-checked:border-button-info has-checked:ring-button-info/30 has-focus-visible:ring-border-focus hover:border-border-focus/60 cursor-pointer overflow-hidden rounded-xl border transition-[border-color,box-shadow] has-checked:ring-2 has-focus-visible:ring-2"
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
