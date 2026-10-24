"use client";

import { FRONTEND_SETTINGS } from "@/config/settings";

import { useId, useSyncExternalStore } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  getTabStyle,
  setTabStyle,
  subscribeTabStyle,
} from "@/utils/ui/tabStyle";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Real tabs, so the preview is exactly what the site shows: the style applies
 * site-wide the moment it's picked. Click them to see the indicator move.
 */
function TabStylePreview() {
  return (
    <div className="border-border-card bg-primary-bg space-y-4 rounded-lg border p-4">
      <Tabs defaultValue="overview">
        <TabsList aria-label="Example tabs" fullWidth>
          <TabsTrigger value="overview" fullWidth>
            Overview
          </TabsTrigger>
          <TabsTrigger value="values" fullWidth>
            Values
          </TabsTrigger>
          <TabsTrigger value="history" fullWidth>
            History
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <div aria-hidden="true" className="space-y-2">
        <div className="bg-secondary-text/25 h-2 w-1/3 rounded-full" />
        <div className="bg-secondary-text/15 h-2 w-2/3 rounded-full" />
        <div className="bg-secondary-text/10 h-12 rounded-md" />
      </div>
    </div>
  );
}

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
        {FRONTEND_SETTINGS["tab-style"].title}
      </h3>
      <p className="text-secondary-text mt-1 text-sm">
        {FRONTEND_SETTINGS["tab-style"].description}
        {isAuthenticated
          ? " Syncs with your account."
          : " Saved on this browser."}
      </p>
      {/* Laid out like the navigation layout setting: options beside a preview. */}
      <div className="mt-3 grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div
          role="radiogroup"
          aria-labelledby={`${id}-label`}
          className="flex flex-col gap-3"
        >
          {(["underline", "filled"] as const).map((value) => (
            <label
              key={value}
              // Same card and circle as the navigation layout options.
              className="group border-border-card bg-tertiary-bg has-checked:border-button-info has-checked:bg-button-info/5 has-focus-visible:ring-link hover:border-border-focus/60 flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors has-focus-visible:ring-2"
            >
              <input
                type="radio"
                name={`${id}-tab-style`}
                value={value}
                checked={style === value}
                onChange={() => setTabStyle(value)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className="border-border-card group-has-checked:border-button-info group-has-checked:bg-button-info mt-1 size-4 shrink-0 rounded-full border-2 transition-colors group-has-checked:shadow-[inset_0_0_0_2px_var(--color-tertiary-bg)]"
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
        <TabStylePreview />
      </div>
    </div>
  );
}
