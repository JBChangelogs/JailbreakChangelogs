"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useSafeAuthContext } from "@/contexts/AuthContext";
import { safeLocalStorage } from "@/utils/storage/safeStorage";
import {
  getDesktopNavigation,
  getLayoutShortcutHidden,
  subscribeDesktopNavigation,
} from "@/utils/ui/desktopNavigation";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Icon } from "@/components/ui/IconWrapper";

const HINT_KEY = "navigation-layout-hint-dismissed";
const SETTINGS_HREF = "/settings?highlight=display#display";

export default function NavigationLayoutShortcut() {
  const [showHint, setShowHint] = useState(false);
  const isLargeScreen = useMediaQuery("(min-width: 1536px)");
  const auth = useSafeAuthContext();
  const pathname = usePathname();
  const navigation = useSyncExternalStore(
    subscribeDesktopNavigation,
    getDesktopNavigation,
    () => "sidebar",
  );
  const hidden = useSyncExternalStore(
    subscribeDesktopNavigation,
    getLayoutShortcutHidden,
    () => false,
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowHint(safeLocalStorage.getItem(HINT_KEY) !== "true");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const dismiss = () => {
    safeLocalStorage.setItem(HINT_KEY, "true");
    setShowHint(false);
  };
  const open =
    showHint &&
    isLargeScreen &&
    navigation === "sidebar" &&
    !auth?.isLoading &&
    pathname !== "/settings";

  if (hidden) return null;

  return (
    <Popover open={open}>
      <PopoverAnchor asChild>
        <div className="hidden 2xl:block">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={SETTINGS_HREF}
                aria-label="Change navigation layout"
                className="text-primary-text hover:bg-quaternary-bg focus-visible:ring-link flex size-10 items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="M9 4v16M13 9h4M13 13h4" />
                </svg>
              </Link>
            </TooltipTrigger>
            <TooltipContent>Change navigation layout</TooltipContent>
          </Tooltip>
        </div>
      </PopoverAnchor>
      <PopoverContent
        side="bottom"
        align="end"
        sideOffset={10}
        aria-label="New sidebar navigation"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
        className="bg-primary-bg z-[2147483647] w-80 p-4"
      >
        <span
          aria-hidden="true"
          className="border-border-card bg-primary-bg absolute -top-1.5 right-3.5 size-3 rotate-45 border-t border-l"
        />
        <div className="flex items-start justify-between gap-3">
          <p className="text-primary-text font-semibold">
            New: sidebar navigation
          </p>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss navigation hint"
            className="text-secondary-text hover:text-primary-text focus-visible:ring-link flex size-6 shrink-0 cursor-pointer items-center justify-center rounded focus-visible:ring-2 focus-visible:outline-none"
          >
            <Icon icon="heroicons:x-mark" className="size-4" />
          </button>
        </div>
        <p className="text-secondary-text mt-2 text-sm">
          Prefer the old top bar? Change your layout here.
        </p>
        <Link
          href={SETTINGS_HREF}
          onClick={dismiss}
          className="bg-button-info hover:bg-button-info/90 focus-visible:ring-link mt-3 inline-flex min-h-9 items-center rounded-md px-3 text-sm font-medium text-white focus-visible:ring-2 focus-visible:outline-none"
        >
          Change layout
        </Link>
      </PopoverContent>
    </Popover>
  );
}
