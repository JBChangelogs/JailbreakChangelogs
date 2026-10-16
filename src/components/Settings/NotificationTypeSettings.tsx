"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { NotificationPreferenceToggle } from "@/components/Settings/NotificationPreferenceToggle";
import type { NotificationPreferenceEntry } from "@/services/notificationPreferencesService";
import type { UserData } from "@/types/auth";
import { Icon } from "@/components/ui/IconWrapper";

// Types the API adds that aren't listed here show up under "Other".
const GROUPS = [
  {
    label: "Trading",
    icon: "material-symbols:swap-horiz-rounded",
    description: "Offers on your trade ads and how they turn out.",
    titles: [
      "new_trade_offer",
      "trade_offer_accepted",
      "trade_offer_declined",
      "trade_canceled",
    ],
  },
  {
    label: "Comments and followers",
    icon: "material-symbols:forum-rounded",
    description: "Comments, replies and new followers.",
    titles: [
      "profile_comment",
      "inventory_comment",
      "new_comment_reply",
      "new_follower",
    ],
  },
  {
    label: "Inventory and items",
    icon: "material-symbols:inventory-2-rounded",
    description: "Inventory scans and changes to items.",
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
      icon: "material-symbols:notifications-rounded",
      description: "Everything else.",
      titles: prefs.map((p) => p.title).filter((t) => !known.has(t)),
    },
  ]
    .map((group) => ({
      label: group.label,
      icon: group.icon,
      description: group.description,
      prefs: prefs.filter((p) => group.titles.includes(p.title)),
    }))
    .filter((group) => group.prefs.length);

  const [open, setOpen] = useState(() => new Set<string>());
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
        <Icon
          icon="lucide:search"
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
            // The highlighted preference's group stays open while the
            // highlight is active, even if it arrives after mount.
            const expanded =
              !!search ||
              open.has(group.label) ||
              all.some((p) => p.title === highlight);
            const panelId = `notification-group-${group.label.replace(/\W+/g, "-").toLowerCase()}`;
            return (
              <div
                key={group.label}
                className="border-border-card overflow-hidden rounded-lg border"
              >
                <div className="has-focus-visible:bg-tertiary-bg/60 hover:bg-tertiary-bg/60 flex items-center gap-3 p-3 transition-colors duration-200 motion-reduce:transition-none">
                  <button
                    type="button"
                    onClick={() => toggleOpen(group.label)}
                    aria-expanded={expanded}
                    aria-controls={panelId}
                    disabled={!!search}
                    className="focus-visible:ring-border-focus flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-md text-left focus-visible:ring-2 focus-visible:outline-none disabled:cursor-default"
                  >
                    <span className="bg-icon-tile-bg text-icon-tile flex size-10 shrink-0 items-center justify-center rounded-lg">
                      <Icon
                        icon={group.icon}
                        aria-hidden="true"
                        className="size-5"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="text-primary-text block font-medium">
                        {group.label}
                      </span>
                      <span className="text-secondary-text mt-0.5 block text-sm">
                        {group.description}
                      </span>
                    </span>
                    <Icon
                      icon="lucide:chevron-down"
                      aria-hidden="true"
                      className={`text-secondary-text size-4 shrink-0 transition-transform duration-200 motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`}
                    />
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
                {/* Animated open/close, like the FAQ page. */}
                <div
                  id={panelId}
                  className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                >
                  <div className="overflow-hidden" inert={!expanded}>
                    <ul className="border-border-card border-t px-3 py-1">
                      {group.prefs.map((pref) => {
                        const isHighlighted = pref.title === highlight;
                        return (
                          <li
                            key={pref.title}
                            className="has-focus-visible:bg-tertiary-bg/60 hover:bg-tertiary-bg/60 -mx-3 rounded-lg px-3 py-2 pl-16 transition-colors duration-200 motion-reduce:transition-none"
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
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
