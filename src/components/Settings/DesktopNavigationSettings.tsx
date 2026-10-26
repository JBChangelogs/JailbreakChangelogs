"use client";

import { FRONTEND_SETTINGS } from "@/config/settings";

import { useId, useSyncExternalStore } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useAuthContext } from "@/contexts/AuthContext";
import { Switch } from "@/components/ui/switch";
import { SETTING_HIGHLIGHT } from "@/components/Settings/SettingsCard";
import {
  getDesktopNavigation,
  getLayoutShortcutHidden,
  setDesktopNavigation,
  setLayoutShortcutHidden,
  subscribeDesktopNavigation,
  type DesktopNavigation,
} from "@/utils/ui/desktopNavigation";

const LAYOUTS: {
  value: DesktopNavigation;
  title: string;
  description: string;
}[] = [
  {
    value: "sidebar",
    title: "Sidebar",
    description: "Navigation beside the page content.",
  },
  {
    value: "top-bar",
    title: "Top bar",
    description: "Navigation above the page content.",
  },
];

const MOTION =
  "transition-all duration-700 ease-in-out motion-reduce:transition-none";

/** Animates between layouts by moving the same shapes. */
function LayoutPreview({ layout }: { layout: DesktopNavigation }) {
  const sidebar = layout === "sidebar";
  return (
    <svg
      viewBox="0 0 240 140"
      role="img"
      aria-label={
        sidebar
          ? "Sidebar navigation beside the page content with search centered in the header"
          : "Top bar navigation above the page content with search after the navigation links"
      }
      className="border-border-card bg-primary-bg w-full rounded-lg border"
    >
      <rect width="240" height="20" className="fill-quaternary-bg" />
      <rect
        x="10"
        y="8"
        width="26"
        height="4"
        rx="2"
        className="fill-secondary-text"
      />
      <g className="fill-link">
        <rect
          style={{
            x: 0,
            y: sidebar ? 20 : 0,
            width: sidebar ? 56 : 240,
            height: sidebar ? 120 : 20,
          }}
          className={MOTION}
          opacity="0.12"
        />
        {[0, 1, 2, 3].map((index) => (
          <rect
            key={index}
            style={{
              x: sidebar ? 10 : 48 + index * 20,
              y: sidebar ? 34 + index * 18 : 8,
              width: sidebar ? 34 : 14,
            }}
            height="4"
            rx="2"
            className={MOTION}
          />
        ))}
      </g>
      <g
        style={{
          transform: sidebar ? "translate(86px,5px)" : "translate(134px,5px)",
        }}
        className={MOTION}
      >
        <rect
          style={{ width: sidebar ? 68 : 64 }}
          height="10"
          rx="3"
          className={`fill-tertiary-bg stroke-border-card ${MOTION}`}
        />
        <g className="stroke-secondary-text" fill="none" strokeWidth="0.8">
          <circle cx="6" cy="4.5" r="1.7" />
          <path d="M7.3 5.8 9 7.5" />
        </g>
      </g>
      <g className="fill-secondary-text">
        <circle cx="214" cy="10" r="2" />
        <circle cx="226" cy="10" r="3" />
      </g>
      <g
        style={{
          transform: sidebar ? "translate(68px,32px)" : "translate(12px,32px)",
        }}
        className={`fill-secondary-text ${MOTION}`}
      >
        <rect width="76" height="6" rx="3" opacity="0.6" />
        <rect y="14" width="112" height="4" rx="2" opacity="0.25" />
        <rect
          y="32"
          style={{ width: sidebar ? 160 : 216 }}
          className={MOTION}
          height="62"
          rx="5"
          opacity="0.08"
        />
      </g>
    </svg>
  );
}

export default function DesktopNavigationSettings() {
  const id = useId();
  const { isAuthenticated } = useAuthContext();
  const mode = useSyncExternalStore(
    subscribeDesktopNavigation,
    getDesktopNavigation,
    () => "sidebar" as const,
  );
  const shortcutHidden = useSyncExternalStore(
    subscribeDesktopNavigation,
    getLayoutShortcutHidden,
    () => false,
  );
  const canSwitchNavigation = useMediaQuery("(min-width: 1536px)");

  return (
    <div className="space-y-5">
      <div>
        <h3 id={`${id}-label`} className="text-primary-text font-medium">
          {FRONTEND_SETTINGS["navigation-layout"].title}
        </h3>
        <p className="text-secondary-text mt-1 text-sm">
          {FRONTEND_SETTINGS["navigation-layout"].description}
          {isAuthenticated
            ? " Syncs with your account."
            : " Saved on this browser."}
        </p>
      </div>

      {/* CSS, not useMediaQuery, so wide screens never flash the notice. */}
      <p className="border-button-info bg-button-info/10 text-secondary-text rounded-lg border p-3 text-sm 2xl:hidden">
        <span className="text-primary-text font-medium">
          Larger screen required.
        </span>{" "}
        You can change this on screens 1536px wide or larger.
      </p>

      <div className="grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div
          role="radiogroup"
          aria-labelledby={`${id}-label`}
          className="flex flex-col gap-3"
        >
          {LAYOUTS.map((layout) => (
            <label
              key={layout.value}
              className="group border-border-card bg-tertiary-bg has-checked:border-button-info has-checked:bg-button-info/5 has-focus-visible:ring-link hover:border-border-focus/60 has-disabled:hover:border-border-card flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors has-focus-visible:ring-2 has-disabled:cursor-not-allowed has-disabled:opacity-70"
            >
              <input
                type="radio"
                name={`${id}-layout`}
                value={layout.value}
                checked={mode === layout.value}
                disabled={!canSwitchNavigation}
                onChange={() => setDesktopNavigation(layout.value)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className="border-border-card group-has-checked:border-button-info group-has-checked:bg-button-info mt-1 size-4 shrink-0 rounded-full border-2 transition-colors group-has-checked:shadow-[inset_0_0_0_2px_var(--color-tertiary-bg)]"
              />
              <span>
                <span className="text-primary-text block font-medium">
                  {layout.title}
                </span>
                <span className="text-secondary-text block text-sm">
                  {layout.description}
                </span>
              </span>
            </label>
          ))}
        </div>
        <LayoutPreview layout={mode} />
      </div>

      <div
        className={`${SETTING_HIGHLIGHT} flex items-center justify-between gap-4`}
      >
        <div>
          <label
            htmlFor={`${id}-shortcut`}
            className="text-primary-text font-medium"
          >
            {FRONTEND_SETTINGS["navigation-shortcut"].title}
          </label>
          <p className="text-secondary-text mt-1 text-sm">
            {FRONTEND_SETTINGS["navigation-shortcut"].description}
          </p>
        </div>
        <Switch
          id={`${id}-shortcut`}
          checked={!shortcutHidden}
          onCheckedChange={(show) => setLayoutShortcutHidden(!show)}
        />
      </div>
    </div>
  );
}
