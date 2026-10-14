"use client";

import { useId, useSyncExternalStore } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  getTabStyle,
  setTabStyle,
  subscribeTabStyle,
} from "@/utils/ui/tabStyle";

export default function TabStyleSettings() {
  const id = useId();
  const { isAuthenticated } = useAuthContext();
  const style = useSyncExternalStore(
    subscribeTabStyle,
    getTabStyle,
    () => "underline" as const,
  );

  return (
    <div>
      <h3 id={`${id}-label`} className="text-primary-text font-medium">
        Tab style
      </h3>
      <p className="text-secondary-text mt-1 text-sm">
        Choose how tabs appear across the site.
        {isAuthenticated
          ? " Syncs with your account."
          : " Saved on this browser."}
      </p>
      <div
        role="radiogroup"
        aria-labelledby={`${id}-label`}
        className="mt-3 grid gap-3 sm:grid-cols-2"
      >
        {(["underline", "filled"] as const).map((value) => (
          <label
            key={value}
            className="border-border-card bg-tertiary-bg has-checked:border-button-info has-checked:bg-button-info/5 has-focus-visible:ring-border-focus flex cursor-pointer items-center gap-3 rounded-lg border p-4 has-focus-visible:ring-2"
          >
            <input
              type="radio"
              name={`${id}-tab-style`}
              value={value}
              checked={style === value}
              onChange={() => setTabStyle(value)}
              className="accent-button-info h-4 w-4 shrink-0"
            />
            <span>
              <span className="text-primary-text block font-medium">
                {value === "underline" ? "Underline" : "Filled"}
              </span>
              <span className="text-secondary-text block text-sm">
                {value === "underline"
                  ? "A minimal line under the selected tab."
                  : "A filled background behind the selected tab."}
              </span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
