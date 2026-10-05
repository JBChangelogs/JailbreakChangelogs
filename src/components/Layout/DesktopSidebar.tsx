"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/IconWrapper";
import { cn } from "@/lib/utils";
import { getNavigationHref } from "@/utils/ui/navigation";
import { navigationSections } from "@/utils/ui/navigation-menu";

export default function DesktopSidebar({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();
  const activeHref = getNavigationHref(pathname);
  const navigationRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
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
  }, [pathname, collapsed]);

  const linkClassName = (active: boolean) =>
    cn(
      "focus-visible:ring-link flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none",
      active
        ? "bg-button-info/10 text-primary-text"
        : "text-primary-text/85 hover:bg-quaternary-bg hover:text-primary-text",
      collapsed && "justify-center gap-0 px-0",
    );
  const labelClassName = cn(
    "overflow-hidden whitespace-nowrap transition-opacity duration-300 motion-reduce:transition-none",
    collapsed ? "w-0 opacity-0" : "min-w-0 flex-1 opacity-100",
  );

  return (
    <aside
      data-desktop-sidebar={collapsed ? "collapsed" : "expanded"}
      aria-label="Site navigation"
      className="bg-secondary-bg border-border-card fixed bottom-0 left-0 z-1200 hidden flex-col border-r 2xl:flex"
      style={{ top: "var(--header-height, 60px)", width: collapsed ? 72 : 240 }}
    >
      <nav
        ref={navigationRef}
        id="desktop-sidebar-navigation"
        aria-label="Main"
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3"
      >
        <div className="flex flex-col gap-4">
          {navigationSections.map((section) => (
            <section
              key={section.id}
              aria-labelledby={`desktop-heading-${section.id}`}
            >
              <h2
                id={`desktop-heading-${section.id}`}
                className="text-primary-text/70 mb-1 flex h-4 items-center px-3 text-[11px] font-semibold tracking-wider uppercase"
              >
                {collapsed ? (
                  <>
                    <span className="sr-only">{section.title}</span>
                    <span
                      aria-hidden="true"
                      className="bg-border-card mx-auto h-px w-6"
                    />
                  </>
                ) : (
                  section.title
                )}
              </h2>
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      prefetch={item.prefetch}
                      title={collapsed ? item.title : undefined}
                      aria-current={
                        activeHref === item.href
                          ? pathname === item.href
                            ? "page"
                            : "location"
                          : undefined
                      }
                      className={linkClassName(activeHref === item.href)}
                    >
                      <Icon icon={item.icon} className="h-5 w-5 shrink-0" />
                      <span className={labelClassName}>{item.title}</span>
                      {!collapsed && item.badge === "live" && (
                        <span className="bg-button-info/20 text-link shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase">
                          Live
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </nav>
    </aside>
  );
}
