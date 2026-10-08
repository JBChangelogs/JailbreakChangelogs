"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import {
  getLayoutShortcutHidden,
  subscribeDesktopNavigation,
} from "@/utils/ui/desktopNavigation";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
const SETTINGS_HREF = "/settings?highlight=display#display";

export default function NavigationLayoutShortcut() {
  const hidden = useSyncExternalStore(
    subscribeDesktopNavigation,
    getLayoutShortcutHidden,
    () => false,
  );

  if (hidden) return null;

  return (
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
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="3" width="20" height="18" rx="2" />
              <path d="M8 3v18M12 8h6M12 12h6M12 16h6" />
            </svg>
          </Link>
        </TooltipTrigger>
        <TooltipContent>Change navigation layout</TooltipContent>
      </Tooltip>
    </div>
  );
}
