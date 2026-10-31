"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/IconWrapper";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getNavigationHref } from "@/utils/ui/navigation";
import { navigationSections } from "@/utils/ui/navigation-menu";

export default function DesktopSidebar({
  collapsed,
  expandOnHover = false,
  onToggle,
}: {
  collapsed: boolean;
  expandOnHover?: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const activeHref = getNavigationHref(pathname);
  const navigationRef = useRef<HTMLElement>(null);
  const [openTooltip, setOpenTooltip] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const temporarilyExpanded =
    collapsed && expandOnHover && (hovered || focused);
  const isCollapsed = collapsed && !temporarilyExpanded;
  const toggleLabel = temporarilyExpanded
    ? "Keep sidebar open"
    : isCollapsed
      ? "Show sidebar"
      : "Hide sidebar";

  useLayoutEffect(() => {
    setOpenTooltip(null);
    const navigation = navigationRef.current;
    if (!navigation) return;

    const revealActiveLink = () => {
      const activeLink =
        navigation.querySelector<HTMLElement>("[aria-current]");
      if (!activeLink || !navigation.clientHeight) return;
      const viewport = navigation.getBoundingClientRect();
      const link = activeLink.getBoundingClientRect();
      if (link.top < viewport.top + 24 || link.bottom > viewport.bottom - 24) {
        navigation.scrollTop +=
          (link.top + link.bottom - viewport.top - viewport.bottom) / 2;
      }
    };

    revealActiveLink();
    const observer = new ResizeObserver(revealActiveLink);
    observer.observe(navigation);
    return () => observer.disconnect();
  }, [pathname, isCollapsed]);

  const linkClassName = (active: boolean) =>
    cn(
      "focus-visible:ring-link flex min-h-10 items-center gap-2 overflow-hidden rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none",
      active
        ? "bg-button-info/10 text-primary-text"
        : "text-primary-text/85 hover:bg-quaternary-bg hover:text-primary-text",
    );
  const labelClassName =
    "whitespace-nowrap opacity-[var(--desktop-sidebar-expanded-opacity,1)] transition-opacity duration-225 ease-[ease-out] motion-reduce:transition-none";

  return (
    <aside
      data-desktop-sidebar={isCollapsed ? "collapsed" : "expanded"}
      aria-label="Site navigation"
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse" || event.pointerType === "pen")
          setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
      onFocusCapture={(event) => {
        if (event.target.matches(":focus-visible")) setFocused(true);
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocused(false);
      }}
      className="bg-secondary-bg border-border-card fixed bottom-0 left-0 z-1200 hidden flex-col border-r 2xl:flex"
      style={{
        top: "max(60px, var(--header-height, 60px))",
        width: temporarilyExpanded
          ? "240px"
          : "var(--desktop-sidebar-width, 240px)",
        ...(temporarilyExpanded && {
          "--desktop-sidebar-expanded-opacity": 1,
          "--desktop-sidebar-collapsed-opacity": 0,
        }),
      }}
    >
      <nav
        ref={navigationRef}
        id="desktop-sidebar-navigation"
        aria-label="Main"
        className="scrollbar-hide min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain p-3"
      >
        <div className="flex flex-col gap-4">
          {navigationSections.map((section) => (
            <section
              key={section.id}
              aria-labelledby={`desktop-heading-${section.id}`}
            >
              <h2
                id={`desktop-heading-${section.id}`}
                className="text-primary-text/70 relative mb-1 flex h-4 items-center overflow-hidden px-3 text-[11px] font-semibold tracking-wider uppercase"
              >
                <span className={labelClassName}>{section.title}</span>
                <span
                  aria-hidden="true"
                  className="bg-border-card absolute left-3 h-px w-6 opacity-[var(--desktop-sidebar-collapsed-opacity,0)] transition-opacity duration-225 ease-[ease-out] motion-reduce:transition-none"
                />
              </h2>
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <Tooltip
                      open={isCollapsed && openTooltip === item.href}
                      onOpenChange={(open) =>
                        setOpenTooltip((current) =>
                          open && isCollapsed
                            ? item.href
                            : current === item.href
                              ? null
                              : current,
                        )
                      }
                    >
                      <TooltipTrigger asChild>
                        <Link
                          href={item.href}
                          prefetch={item.prefetch}
                          aria-label={item.title}
                          aria-current={
                            activeHref === item.href
                              ? pathname === item.href
                                ? "page"
                                : "location"
                              : undefined
                          }
                          className={linkClassName(activeHref === item.href)}
                        >
                          <Icon
                            icon={item.icon}
                            className={cn(
                              "h-5 w-5 shrink-0",
                              activeHref === item.href
                                ? "text-primary-text"
                                : "text-secondary-text",
                            )}
                          />
                          <span
                            className={cn(
                              "min-w-0 flex-1 overflow-hidden",
                              labelClassName,
                            )}
                          >
                            {item.title}
                          </span>
                          {item.badge === "live" && (
                            <span
                              className={cn(
                                "bg-menu-badge-bg text-menu-badge-text shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase",
                                labelClassName,
                              )}
                            >
                              Live
                            </span>
                          )}
                        </Link>
                      </TooltipTrigger>
                      {isCollapsed && (
                        <TooltipContent side="right" sideOffset={8}>
                          {item.title}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </nav>
      {/* Leave room for the browser's bottom-left link preview. */}
      <div className="relative shrink-0 p-3 pb-6">
        <div
          aria-hidden="true"
          className={cn(
            "border-border-card absolute top-0 border-t",
            isCollapsed ? "left-6 w-6" : "inset-x-3",
          )}
        />
        <Tooltip
          open={isCollapsed && openTooltip === "toggle"}
          onOpenChange={(open) =>
            setOpenTooltip((current) =>
              open && isCollapsed
                ? "toggle"
                : current === "toggle"
                  ? null
                  : current,
            )
          }
        >
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onToggle}
              aria-label={toggleLabel}
              aria-expanded={!isCollapsed}
              aria-controls="desktop-sidebar-navigation"
              className={cn(linkClassName(false), "w-full cursor-pointer")}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                aria-hidden="true"
                className="text-secondary-text h-5 w-5 shrink-0"
              >
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path d="M9 4v16M5.5 8h1M5.5 11h1M5.5 14h1" />
              </svg>
              <span className={labelClassName}>{toggleLabel}</span>
            </button>
          </TooltipTrigger>
          {isCollapsed && (
            <TooltipContent side="right" sideOffset={8}>
              Show sidebar
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    </aside>
  );
}
