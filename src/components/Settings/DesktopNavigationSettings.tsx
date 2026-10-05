"use client";

import { useEffect, useId, useState, useSyncExternalStore } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useAuthContext } from "@/contexts/AuthContext";
import { Icon } from "@/components/ui/IconWrapper";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

  const [previewMode, setPreviewMode] = useState<"sidebar" | "top-bar">(
    "sidebar",
  );
  const [manualPreview, setManualPreview] = useState(false);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  useEffect(() => {
    if (reducedMotion || manualPreview) return;
    const showTopBar = window.setTimeout(() => setPreviewMode("top-bar"), 1800);
    const showSidebar = window.setTimeout(
      () => setPreviewMode("sidebar"),
      3600,
    );
    return () => {
      window.clearTimeout(showTopBar);
      window.clearTimeout(showSidebar);
    };
  }, [reducedMotion, manualPreview]);

  return (
    <div className="space-y-4">
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-labelledby={`${id}-label ${id}-value`}
              aria-describedby={`${id}-description`}
              className="border-border-card bg-tertiary-bg text-primary-text hover:border-border-focus focus-visible:ring-link flex min-h-11 w-full items-center justify-between gap-4 rounded-lg border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none sm:w-48 sm:shrink-0"
            >
              <span id={`${id}-value`}>
                {mode === "sidebar" ? "Sidebar" : "Top bar"}
              </span>
              <Icon
                icon="heroicons:chevron-down"
                className="text-secondary-text h-4 w-4"
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-(--radix-dropdown-menu-trigger-width)"
          >
            <DropdownMenuRadioGroup
              value={mode}
              onValueChange={(value) => {
                if (value === "sidebar" || value === "top-bar")
                  setDesktopNavigation(value);
              }}
            >
              <DropdownMenuRadioItem value="sidebar">
                Sidebar
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="top-bar">
                Top bar
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <figure className="sm:ml-auto sm:w-48">
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              tabIndex={0}
              className="focus-visible:ring-link rounded-lg focus-visible:ring-2 focus-visible:outline-none"
            >
              <svg
                viewBox="0 0 240 140"
                role="img"
                aria-label={
                  previewMode === "sidebar"
                    ? "Sidebar navigation beside the page content"
                    : "Top bar navigation above the page content"
                }
                className="border-border-card bg-tertiary-bg w-full max-w-xs overflow-hidden rounded-lg border"
              >
                <rect width="240" height="20" className="fill-quaternary-bg" />
                <rect
                  x="10"
                  y="8"
                  width="26"
                  height="4"
                  rx="2"
                  className="fill-secondary-text"
                />
                <g className="fill-link">
                  <rect
                    style={{
                      x: 0,
                      y: previewMode === "sidebar" ? 20 : 0,
                      width: previewMode === "sidebar" ? 56 : 240,
                      height: previewMode === "sidebar" ? 120 : 20,
                    }}
                    className="transition-all duration-700 ease-in-out motion-reduce:transition-none"
                    opacity="0.12"
                  />
                  {[0, 1, 2, 3].map((index) => (
                    <rect
                      key={index}
                      style={{
                        x: previewMode === "sidebar" ? 10 : 60 + index * 42,
                        y: previewMode === "sidebar" ? 34 + index * 18 : 8,
                        width: previewMode === "sidebar" ? 34 : 28,
                      }}
                      height="4"
                      rx="2"
                      className="transition-all duration-700 ease-in-out motion-reduce:transition-none"
                    />
                  ))}
                </g>
                <g
                  style={{
                    transform:
                      previewMode === "sidebar"
                        ? "translate(68px,32px)"
                        : "translate(12px,32px)",
                  }}
                  className="fill-secondary-text transition-transform duration-700 ease-in-out motion-reduce:transition-none"
                >
                  <rect width="76" height="6" rx="3" opacity="0.6" />
                  <rect y="14" width="112" height="4" rx="2" opacity="0.25" />
                  <rect
                    y="32"
                    style={{ width: previewMode === "sidebar" ? 160 : 216 }}
                    className="transition-all duration-700 ease-in-out motion-reduce:transition-none"
                    height="62"
                    rx="5"
                    opacity="0.08"
                  />
                </g>
              </svg>
            </div>
          </TooltipTrigger>
          <TooltipContent
            side="left"
            align="center"
            sideOffset={8}
            className="max-w-64"
          >
            {previewMode === "sidebar"
              ? "Sidebar navigation beside the page content"
              : "Top bar navigation above the page content"}
          </TooltipContent>
        </Tooltip>
        <figcaption className="text-secondary-text mt-2 text-xs">
          <p className="text-primary-text font-medium">
            {previewMode === "sidebar" ? "Sidebar example" : "Top bar example"}
          </p>
          <p className="mt-1">
            {previewMode === "sidebar"
              ? "Navigation beside the content."
              : "Navigation above the content."}
          </p>
          <button
            type="button"
            onClick={() => {
              setManualPreview(true);
              setPreviewMode((current) =>
                current === "sidebar" ? "top-bar" : "sidebar",
              );
            }}
            className="border-border-card bg-tertiary-bg text-primary-text hover:bg-quaternary-bg hover:border-border-focus focus-visible:ring-link mt-3 flex min-h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-md border px-2 font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <Icon icon="heroicons:arrow-path" className="h-3.5 w-3.5" />
            Show {previewMode === "sidebar" ? "top bar" : "sidebar"} example
          </button>
        </figcaption>
      </figure>
    </div>
  );
}
