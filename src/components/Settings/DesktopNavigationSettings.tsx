"use client";

import { useId, useSyncExternalStore } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  getDesktopNavigation,
  setDesktopNavigation,
  subscribeDesktopNavigation,
} from "@/utils/ui/desktopNavigation";

export default function DesktopNavigationSettings() {
  const id = useId();
  const { isAuthenticated } = useAuthContext();
  const mode = useSyncExternalStore(
    subscribeDesktopNavigation,
    getDesktopNavigation,
    () => "sidebar",
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div>
        <p
          id={`${id}-label`}
          className="text-primary-text text-base font-medium"
        >
          Desktop navigation
        </p>
        <p
          id={`${id}-description`}
          className="text-secondary-text mt-1 text-sm"
        >
          Choose your navigation on large screens.
          {isAuthenticated
            ? " Syncs with your account."
            : " Saved on this browser."}
        </p>
      </div>
      <fieldset
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-description`}
        className="border-border-card bg-tertiary-bg flex w-fit shrink-0 rounded-lg border p-1"
      >
        {(
          [
            ["sidebar", "Sidebar"],
            ["top-bar", "Top bar"],
          ] as const
        ).map(([value, label]) => (
          <label key={value} className="cursor-pointer">
            <input
              type="radio"
              name={`${id}-navigation`}
              value={value}
              checked={mode === value}
              onChange={() => setDesktopNavigation(value)}
              className="peer sr-only"
            />
            <span className="text-secondary-text hover:text-primary-text peer-checked:bg-quaternary-bg peer-checked:text-primary-text peer-focus-visible:ring-link flex min-h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors peer-checked:shadow-sm peer-focus-visible:ring-2">
              {label}
            </span>
          </label>
        ))}
      </fieldset>
    </div>
  );
}
