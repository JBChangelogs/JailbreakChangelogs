"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { colorName, withDefaultColors } from "@/utils/ui/themeColors";
import { MARKET_COLORS } from "@/utils/items/badgeColors";
import { marketThemeVars } from "@/utils/ui/marketThemeVars";
import { readableTextColor } from "@/utils/ui/accentColor";

/** A group of related samples, in the order things appear on the site. */
function Section({
  children,
}: {
  /** Names the group in this file; not shown. */
  title: string;
  children: ReactNode;
}) {
  return <section className="space-y-1.5">{children}</section>;
}

// Static stand-ins for states that normally need a hover or a click.
const chip = "rounded-md px-2.5 py-1 text-xs font-medium";
const pill = "rounded-full px-2 py-0.5 text-[11px] font-medium";
const field = "rounded-md border px-2 py-1 text-[11px]";
// The hero and overlays sit on a real site background, as on the homepage.
const photo = "bg-[url(/backgrounds/v2/background1.webp)] bg-cover bg-center";

const SUPPORTERS = [
  ["bronze", "Supporter I"],
  ["silver", "Supporter II"],
  ["gold", "Supporter III"],
] as const;

// These also name the text color they set, when clicked or hovered.
const MAIN_BUTTONS = new Set([
  "button-info",
  "button-success",
  "button-danger",
]);

/** Tags an element with the colors it shows, for the tooltip and clicks. */
const colors = (...keys: string[]) => ({
  "data-color": keys.map((key) => `--color-${key}`).join(" "),
});

/**
 * A mock page in a theme's colors, with at least one thing drawn in each of
 * its colors, ordered like the site. The vars are set on this element, so
 * the usual color classes inside it read the theme instead of the page's.
 * Content is placeholder text only, so it can't be mistaken for real data.
 *
 * Hovering anything names its colors; with `onPick`, clicking it passes
 * them and the element on, so the editor can open its controls beside it.
 */
export default function CustomThemePreview({
  vars,
  scheme,
  logoFilter,
  onPick,
  hideTooltips = false,
  className,
}: {
  vars: Record<string, string>;
  scheme: "dark" | "light";
  logoFilter: string | null;
  onPick?: (keys: string[], element: Element) => void;
  hideTooltips?: boolean;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  // The hovered element's box, relative to the preview, and its colors.
  const [tip, setTip] = useState<{
    text: string;
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  const keysAt = (target: EventTarget) => {
    const el = (target as Element).closest?.("[data-color]");
    return el && rootRef.current?.contains(el)
      ? { el, keys: el.getAttribute("data-color")!.split(" ") }
      : null;
  };

  // One site tooltip for the whole preview: its anchor is moved over
  // whatever is hovered, instead of wrapping every sample in a Tooltip.
  const showTip = (event: React.MouseEvent) => {
    if (hideTooltips) return setTip(null);
    const hit = keysAt(event.target);
    const root = rootRef.current;
    if (!hit || !root) return setTip(null);
    const box = hit.el.getBoundingClientRect();
    const rootBox = root.getBoundingClientRect();
    setTip({
      text: hit.keys.map(colorName).join(" · "),
      left: box.left - rootBox.left,
      top: box.top - rootBox.top,
      width: box.width,
      height: box.height,
    });
  };

  return (
    <div
      ref={rootRef}
      data-theme-color-preview={onPick ? "" : undefined}
      aria-hidden="true"
      onMouseOver={showTip}
      onMouseLeave={() => setTip(null)}
      onClick={(event) => {
        setTip(null);
        const hit = keysAt(event.target);
        if (hit && onPick) onPick(hit.keys, hit.el);
      }}
      className={cn(
        "bg-primary-bg text-primary-text border-border-card @container relative overflow-hidden rounded-xl border",
        onPick && "[&_[data-color]]:cursor-pointer",
        className,
      )}
      style={
        {
          // Older themes lack the newer text colors; the page's would leak in.
          ...marketThemeVars(withDefaultColors(vars), readableTextColor),
          "--logo-filter": logoFilter || "none",
          colorScheme: scheme,
        } as CSSProperties
      }
    >
      {/* Header */}
      <div
        className="bg-secondary-bg border-border-card flex items-center justify-between border-b px-3 py-2"
        {...colors("secondary-bg", "border-card")}
      >
        <Image
          src="/logos/JBCL_Header.webp"
          alt=""
          width={256}
          height={58}
          className="header-logo h-6 w-auto"
        />
        <span className="flex items-center gap-1.5">
          <span
            className="text-secondary-text text-xs"
            {...colors("secondary-text")}
          >
            Menu
          </span>
          <span
            className="bg-quaternary-bg relative size-5 rounded-md"
            {...colors("quaternary-bg")}
          >
            <span
              className="bg-button-danger absolute -top-0.5 -right-0.5 size-2 rounded-full"
              {...colors("button-danger")}
            />
          </span>
        </span>
      </div>

      {/* Hero */}
      <div className={cn("relative h-9", photo)} {...colors("hero-overlay")}>
        <div className="bg-hero-overlay absolute inset-0" />
        <p className="relative px-3 pt-2 text-sm font-bold text-white">
          Hero banner
        </p>
      </div>

      <div className="grid gap-3 p-3 @lg:grid-cols-2 @lg:items-start">
        <div className="space-y-3">
          <Section title="Page">
            <p className="text-tertiary-text text-[11px]">
              <span {...colors("tertiary-text")}>Home</span>{" "}
              <span
                className="text-quaternary-text"
                {...colors("quaternary-text")}
              >
                / Page
              </span>
            </p>
            <p
              className="text-primary-text w-fit text-base font-bold"
              {...colors("primary-text")}
            >
              Page title
            </p>
            <p
              className="text-secondary-text w-fit text-xs"
              {...colors("secondary-text")}
            >
              A short description under the title.
            </p>
          </Section>

          <Section title="Cards">
            <div
              className="bg-secondary-bg border-border-card shadow-card-shadow rounded-lg border p-3 shadow-md"
              {...colors("secondary-bg", "border-card", "card-shadow")}
            >
              <div className="flex items-start justify-between gap-2">
                <p
                  className="text-card-headline font-semibold"
                  {...colors("card-headline")}
                >
                  Card title
                </p>
                <span
                  className="text-card-highlight text-xs font-semibold"
                  {...colors("card-highlight")}
                >
                  Highlight
                </span>
              </div>
              <p
                className="text-card-paragraph mt-1 w-fit text-xs"
                {...colors("card-paragraph")}
              >
                Body text in a card.
              </p>
              <span
                className={cn(
                  pill,
                  "bg-card-tag-bg text-card-tag-text mt-2 inline-block",
                )}
                {...colors("card-tag-bg", "card-tag-text")}
              >
                Tag
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-[10px]">
              <span
                className="bg-tertiary-bg rounded-md p-2"
                {...colors("tertiary-bg")}
              >
                Raised
              </span>
              <span
                className="bg-surface-bg rounded-md p-2"
                {...colors("surface-bg")}
              >
                Surface
              </span>
              <span
                className="bg-quaternary-bg rounded-md p-2"
                {...colors("quaternary-bg")}
              >
                Subtle
              </span>
            </div>
            {(["primary", "secondary", "tertiary"] as const).map((border) => (
              <div
                key={border}
                className="py-1"
                {...colors(`border-${border}`)}
              >
                <hr
                  className="border-0 border-t"
                  style={{ borderColor: `var(--color-border-${border})` }}
                />
              </div>
            ))}
          </Section>

          <Section title="Links">
            <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
              {(
                [
                  ["link", "Link"],
                  ["link-hover", "Hovered"],
                  ["link-active", "Pressed"],
                  ["link-visited", "Visited"],
                ] as const
              ).map(([key, label]) => (
                <span
                  key={key}
                  className="underline"
                  style={{ color: `var(--color-${key})` }}
                  {...colors(key)}
                >
                  {label}
                </span>
              ))}
            </p>
          </Section>

          <Section title="Tabs">
            <span className="text-secondary-text text-[10px] font-semibold">
              Tabs / Filled tabs
            </span>
            <div
              className="flex gap-1 text-xs font-medium"
              style={{
                boxShadow:
                  "inset 0 -1px color-mix(in srgb, var(--color-border-primary) 60%, transparent)",
              }}
              {...colors("border-primary")}
            >
              <span
                className="text-primary-text border-border-focus border-b-2 px-2.5 py-1.5"
                {...colors("border-focus", "primary-text")}
              >
                Active
              </span>
              <span
                className="bg-quaternary-bg text-primary-text rounded-md px-2.5 py-1.5"
                {...colors("quaternary-bg", "primary-text")}
              >
                Hovered
              </span>
              <span
                className="text-secondary-text px-2.5 py-1.5"
                {...colors("secondary-text")}
              >
                Tab
              </span>
            </div>
            {/* The filled tab style, from Settings. */}
            <div
              className="bg-tertiary-bg border-border-card flex gap-0.5 rounded-lg border p-0.5 text-xs font-medium"
              {...colors("tertiary-bg", "border-card")}
            >
              <span
                className="bg-tab-active text-form-button-text rounded-md px-2.5 py-1"
                {...colors("tab-active", "form-button-text")}
              >
                Active
              </span>
              <span
                className="bg-quaternary-bg text-primary-text rounded-md px-2.5 py-1"
                {...colors("quaternary-bg", "primary-text")}
              >
                Hovered
              </span>
              <span
                className="text-secondary-text px-2.5 py-1"
                {...colors("secondary-text")}
              >
                Tab
              </span>
            </div>
          </Section>

          <Section title="Forms">
            <p
              className="text-primary-text w-fit text-xs font-medium"
              {...colors("primary-text")}
            >
              Label
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <div
                className={cn(
                  field,
                  "bg-form-input border-border-primary text-form-placeholder",
                )}
                {...colors("form-input", "border-primary", "form-placeholder")}
              >
                Placeholder…
              </div>
              <div
                className={cn(
                  field,
                  "bg-form-input-focus border-border-focus text-primary-text",
                )}
                {...colors("form-input-focus", "border-focus")}
              >
                Focused
              </div>
              <div
                className={cn(
                  field,
                  "bg-form-input-disabled border-border-tertiary text-quaternary-text",
                )}
                {...colors("form-input-disabled")}
              >
                Disabled
              </div>
              <div
                className={cn(
                  field,
                  "bg-form-input border-border-error text-primary-text",
                )}
                {...colors("border-error")}
              >
                Invalid
              </div>
            </div>
            <p className="text-[11px]">
              <span className="text-form-error" {...colors("form-error")}>
                Error message
              </span>
              {" · "}
              <span className="text-form-success" {...colors("form-success")}>
                Saved
              </span>
            </p>
          </Section>
        </div>

        <div className="space-y-3">
          <Section title="Buttons">
            {(
              [
                [
                  ["button-info", "Button", "form-button-text"],
                  ["button-info-hover", "Hovered", "form-button-text"],
                  ["button-info-active", "Pressed", "form-button-text"],
                  ["button-info-disabled", "Disabled", "secondary-text"],
                ],
                [
                  ["button-secondary", "Secondary", "primary-text"],
                  ["button-secondary-hover", "Hovered", "primary-text"],
                  ["button-secondary-active", "Pressed", "primary-text"],
                ],
                [
                  ["button-success", "Save", "button-success-text"],
                  ["button-success-hover", "Hovered", "button-success-text"],
                  ["button-danger", "Delete", "button-danger-text"],
                  ["button-danger-hover", "Hovered", "button-danger-text"],
                  ["form-button", "Submit", "form-button-text"],
                ],
              ] as const
            ).map((row, i) => (
              <div key={i} className="flex flex-wrap gap-1.5">
                {row.map(([key, label, text]) => (
                  <span
                    key={key}
                    className={chip}
                    style={{
                      background: `var(--color-${key})`,
                      color: `var(--color-${text})`,
                    }}
                    {...colors(key, ...(MAIN_BUTTONS.has(key) ? [text] : []))}
                  >
                    {label}
                  </span>
                ))}
              </div>
            ))}
          </Section>

          <Section title="Status">
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ["success", "Success"],
                  ["success-vibrant", "Online"],
                  ["warning", "Warning"],
                  ["error", "Error"],
                  ["info", "Info"],
                  ["neutral", "Neutral"],
                ] as const
              ).map(([key, label]) => (
                <span
                  key={key}
                  className={pill}
                  style={{
                    color: `var(--color-status-${key})`,
                    background: `color-mix(in srgb, var(--color-status-${key}) 15%, transparent)`,
                  }}
                  {...colors(`status-${key}`)}
                >
                  {label}
                </span>
              ))}
            </div>
            <p className="flex flex-wrap gap-x-3 text-xs font-medium">
              {(
                [
                  ["warning", "Warning"],
                  ["warning-light", "Light"],
                  ["warning-dark", "Dark"],
                  ["highlight", "Highlight"],
                  ["secondary", "Secondary"],
                  ["tertiary", "Tertiary"],
                ] as const
              ).map(([key, label]) => (
                <span
                  key={key}
                  style={{ color: `var(--color-${key})` }}
                  {...colors(key)}
                >
                  {label}
                </span>
              ))}
            </p>
          </Section>

          <Section title="Demand and trends">
            {(["demand", "trend"] as const).map((group) => (
              <div key={group} className="flex flex-wrap gap-1">
                <span className="text-secondary-text w-full text-[10px] font-semibold">
                  {group === "demand" ? "Demand / Duped demand" : "Trends"}
                </span>
                {Object.keys(MARKET_COLORS)
                  .filter((key) => key.startsWith(`${group}-`))
                  .map((key) => (
                    <span
                      key={key}
                      className="rounded-md px-2 py-0.5 text-[10px] font-semibold"
                      style={{
                        backgroundColor: `var(--color-${key})`,
                        color: `var(--color-${key}-text)`,
                      }}
                      {...colors(key)}
                    >
                      {colorName(`--color-${key}`).replace(
                        /^(Demand|Trend) /,
                        "",
                      )}
                    </span>
                  ))}
              </div>
            ))}
          </Section>

          <Section title="Supporters">
            <div className="grid grid-cols-3 gap-1.5">
              {SUPPORTERS.map(([tier, label]) => (
                <span
                  key={tier}
                  className="rounded-md border p-2 text-[10px] font-semibold"
                  style={{
                    background: `var(--color-supporter-${tier}-bg)`,
                    borderColor: `var(--color-supporter-${tier}-border)`,
                  }}
                  {...colors(
                    `supporter-${tier}-bg`,
                    `supporter-${tier}-border`,
                  )}
                >
                  {label}
                </span>
              ))}
            </div>
          </Section>

          <Section title="Overlays">
            <div
              className={cn(
                "relative grid h-10 grid-cols-3 overflow-hidden rounded-md text-[10px] font-semibold text-white",
                photo,
              )}
            >
              {(["light", "medium", "dark"] as const).map((strength) => (
                <span
                  key={strength}
                  className="p-1.5 capitalize"
                  style={{ background: `var(--color-overlay-${strength})` }}
                  {...colors(`overlay-${strength}`)}
                >
                  {strength}
                </span>
              ))}
            </div>
            <div
              className="bg-overlay-bg rounded-md p-2"
              {...colors("overlay-bg")}
            >
              <div className="bg-secondary-bg border-border-card rounded-md border p-2 text-xs">
                Dialog over the page
              </div>
            </div>
            <div
              className="bg-newsletter-bg rounded-md p-2 text-xs font-semibold"
              style={{ color: "var(--color-primary-bg)" }}
              {...colors("newsletter-bg")}
            >
              Newsletter banner
            </div>
          </Section>
        </div>
      </div>

      {tip && !hideTooltips && (
        // Keyed by position so the tooltip re-anchors to each new element.
        <Tooltip key={`${tip.left},${tip.top}`} open>
          <TooltipTrigger asChild>
            <span
              className="pointer-events-none absolute"
              style={{
                left: tip.left,
                top: tip.top,
                width: tip.width,
                height: tip.height,
              }}
            />
          </TooltipTrigger>
          <TooltipContent>{tip.text}</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
