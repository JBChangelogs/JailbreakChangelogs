"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/IconWrapper";
import { cn } from "@/lib/utils";

export interface SettingsNavSection {
  title: string;
  items: { id: string; title: string; icon: string }[];
}

/**
 * The settings page's section list, styled like the site's sidebar: grouped
 * under small labels, with the current section highlighted. The highlight
 * slides between items, like the tabs' indicator.
 */
export function SettingsSidebar({
  sections,
  active,
  onSelect,
  className,
}: {
  sections: SettingsNavSection[];
  active: string | null;
  onSelect: (id: string) => void;
  className?: string;
}) {
  const navRef = useRef<HTMLElement>(null);
  const [pill, setPill] = useState<{
    top: number;
    height: number;
    animate: boolean;
  } | null>(null);

  // What moves the highlight: the active item, or the items around it.
  const layout = sections.flatMap((section) =>
    section.items.map((item) => item.id),
  );
  const layoutKey = layout.join();
  useLayoutEffect(() => {
    const current =
      navRef.current?.querySelector<HTMLElement>("[aria-current]");
    setPill((prev) => {
      if (!current) return null;
      const top = current.offsetTop;
      const height = current.offsetHeight;
      if (prev && prev.top === top && prev.height === height) return prev;
      // Only slide once it has been shown, so it doesn't sweep in.
      return { top, height, animate: !!prev };
    });
  }, [active, layoutKey]);

  return (
    <nav
      ref={navRef}
      aria-label="Settings sections"
      className={cn("relative", className)}
    >
      {pill && (
        <div
          aria-hidden="true"
          className={cn(
            "bg-button-info/10 pointer-events-none absolute inset-x-3 rounded-lg",
            pill.animate &&
              "transition-[top,height] duration-200 ease-out motion-reduce:transition-none",
          )}
          style={{ top: pill.top, height: pill.height }}
        />
      )}
      <div className="flex flex-col gap-4">
        {sections.map((section) => (
          <section key={section.title}>
            <p className="text-primary-text/70 mb-1 flex h-4 items-center px-3 text-[11px] font-semibold tracking-wider uppercase">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = active === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      aria-current={isActive ? "location" : undefined}
                      onClick={() => onSelect(item.id)}
                      className={cn(
                        "focus-visible:ring-link relative flex min-h-10 w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none",
                        isActive
                          ? "text-primary-text"
                          : "text-primary-text/85 hover:bg-quaternary-bg hover:text-primary-text",
                      )}
                    >
                      <Icon
                        icon={item.icon}
                        aria-hidden="true"
                        className={cn(
                          "h-5 w-5 shrink-0 transition-colors",
                          isActive
                            ? "text-primary-text"
                            : "text-secondary-text",
                        )}
                      />
                      {item.title}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </nav>
  );
}
