"use client";

import { useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { NotificationPreferenceToggle } from "@/components/Settings/NotificationPreferenceToggle";
import type { NotificationPreferenceEntry } from "@/services/notificationPreferencesService";
import type { UserData } from "@/types/auth";

// Types the API adds that aren't listed here show up under "Other".
const GROUPS = [
  {
    label: "Trading",
    titles: [
      "new_trade_offer",
      "trade_offer_accepted",
      "trade_offer_declined",
      "trade_canceled",
    ],
  },
  {
    label: "Comments and followers",
    titles: [
      "profile_comment",
      "inventory_comment",
      "new_comment_reply",
      "new_follower",
    ],
  },
  {
    label: "Inventory and items",
    titles: ["inventory_scanned", "holding_original_item", "item_updated"],
  },
];

const humanize = (title: string) =>
  title
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

interface NotificationTypeSettingsProps {
  prefs: NotificationPreferenceEntry[];
  saving: Record<string, boolean>;
  onToggle: (titles: string | string[], enabled: boolean) => void;
  highlight: string | null;
  userData: Pick<UserData, "flags"> | null;
}

export function NotificationTypeSettings({
  prefs,
  saving,
  onToggle,
  highlight,
  userData,
}: NotificationTypeSettingsProps) {
  const known = new Set(GROUPS.flatMap((group) => group.titles));
  const groups = [
    ...GROUPS,
    {
      label: "Other",
      titles: prefs.map((p) => p.title).filter((t) => !known.has(t)),
    },
  ]
    .map((group) => ({
      label: group.label,
      prefs: prefs.filter((p) => group.titles.includes(p.title)),
    }))
    .filter((group) => group.prefs.length);

  const [open, setOpen] = useState(
    () =>
      new Set(
        groups
          .filter((g) => g.prefs.some((p) => p.title === highlight))
          .map((g) => g.label),
      ),
  );
  const [query, setQuery] = useState("");
  const search = query.trim().toLowerCase();
  const visible = groups
    .map((group) => ({
      ...group,
      prefs: group.prefs.filter((p) =>
        humanize(p.title).toLowerCase().includes(search),
      ),
    }))
    .filter((group) => group.prefs.length);

  const toggleOpen = (label: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (!next.delete(label)) next.add(label);
      return next;
    });

  return (
    <div>
      <div className="relative mb-3">
        <Search
          aria-hidden="true"
          className="text-secondary-text pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search notifications..."
          aria-label="Search notifications"
          className="border-border-card bg-tertiary-bg text-primary-text placeholder:text-secondary-text focus:border-button-info h-10 w-full rounded-lg border py-2 pr-3 pl-9 text-sm outline-none"
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      {visible.length === 0 ? (
        <p className="text-secondary-text py-4 text-center text-sm">
          No notifications match “{query.trim()}”.
        </p>
      ) : (
        <div className="space-y-2">
          {visible.map((group) => {
            const all = groups.find((g) => g.label === group.label)!.prefs;
            const enabledCount = all.filter((p) => p.enabled).length;
            const expanded = !!search || open.has(group.label);
            const panelId = `notification-group-${group.label.replace(/\W+/g, "-").toLowerCase()}`;
            return (
              <div
                key={group.label}
                className="border-border-card rounded-lg border"
              >
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => toggleOpen(group.label)}
                    aria-expanded={expanded}
                    aria-controls={panelId}
                    disabled={!!search}
                    className="focus-visible:ring-border-focus flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-sm text-left focus-visible:ring-2 focus-visible:outline-none disabled:cursor-default"
                  >
                    <ChevronRight
                      aria-hidden="true"
                      className={`text-secondary-text size-4 shrink-0 transition-transform duration-200 motion-reduce:transition-none ${expanded ? "rotate-90" : ""}`}
                    />
                    <span className="text-primary-text font-medium">
                      {group.label}
                    </span>
                    <span className="text-secondary-text text-sm">
                      {enabledCount} of {all.length} on
                    </span>
                  </button>
                  <Switch
                    checked={enabledCount === all.length}
                    onCheckedChange={(enabled) =>
                      onToggle(
                        all.map((p) => p.title),
                        enabled,
                      )
                    }
                    disabled={all.some((p) => saving[p.title])}
                    aria-label={`All ${group.label} notifications`}
                  />
                </div>
                {expanded && (
                  <ul
                    id={panelId}
                    className="border-border-card border-t px-3 py-1"
                  >
                    {group.prefs.map((pref) => {
                      const isHighlighted = pref.title === highlight;
                      return (
                        <li
                          key={pref.title}
                          className="-mx-3 rounded-lg px-3 py-2 pl-9 transition-colors duration-500"
                          style={
                            isHighlighted
                              ? {
                                  backgroundColor:
                                    "color-mix(in srgb, var(--color-button-info), transparent 80%)",
                                }
                              : undefined
                          }
                          ref={(el) => {
                            if (isHighlighted && el) {
                              setTimeout(() => {
                                el.scrollIntoView({
                                  behavior: "smooth",
                                  block: "center",
                                });
                              }, 100);
                            }
                          }}
                        >
                          <NotificationPreferenceToggle
                            title={pref.title}
                            enabled={pref.enabled}
                            disabled={!!saving[pref.title]}
                            onChange={(enabled) =>
                              onToggle(pref.title, enabled)
                            }
                            userData={userData}
                          />
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
