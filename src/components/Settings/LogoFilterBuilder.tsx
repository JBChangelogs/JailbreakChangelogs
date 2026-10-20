"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { hexToHsv } from "@/utils/ui/accentColor";

interface LogoAdjustments {
  /** Degrees around the color wheel, -180 to 180. */
  hue: number;
  /** 1 keeps the colors; lower is softer, higher is more vivid. */
  saturation: number;
  /** 1 keeps the brightness. Only presets set it. */
  brightness: number;
}

const ORIGINAL: LogoAdjustments = { hue: 0, saturation: 1, brightness: 1 };

// ponytail: the logo's blue measured by eye; hue-rotate isn't an exact HSL
// rotation either, so "Match buttons" lands close, not exact. Fine-tuning fixes it.
const LOGO_HUE = 215;

// The site themes' own logo colors, as starting points.
const PRESETS: { name: string; adjust: LogoAdjustments }[] = [
  { name: "Original", adjust: ORIGINAL },
  { name: "Purple", adjust: { hue: 45, saturation: 1, brightness: 1 } },
  { name: "Soft purple", adjust: { hue: 45, saturation: 0.55, brightness: 1 } },
  { name: "Pink", adjust: { hue: 100, saturation: 1, brightness: 1 } },
  { name: "Red", adjust: { hue: 135, saturation: 1.8, brightness: 1 } },
  { name: "Teal", adjust: { hue: -30, saturation: 0.7, brightness: 0.9 } },
  // With Match buttons, 8 options fill rows of 2 and 4.
  { name: "Green", adjust: { hue: -90, saturation: 1, brightness: 1 } },
];

/** Reads the parts of a filter this builder makes; anything else is dropped. */
function parseFilter(filter: string | null): LogoAdjustments {
  const number = (pattern: RegExp, fallback: number) => {
    const match = filter?.match(pattern);
    const value = Number(match?.[1]);
    return match && Number.isFinite(value) ? value : fallback;
  };
  return {
    hue: wrapHue(number(/hue-rotate\((-?[\d.]+)deg\)/, 0)),
    saturation: number(/saturate\(([\d.]+)\)/, 1),
    brightness: number(/brightness\(([\d.]+)\)/, 1),
  };
}

/** Any angle as -180 to 180; hue-rotate(270deg) is the same as -90deg. */
const wrapHue = (hue: number) => ((((hue + 180) % 360) + 360) % 360) - 180;

/** The CSS filter for the adjustments, or null when the logo is unchanged. */
function buildFilter(adjust: LogoAdjustments) {
  // Slider steps leave float noise like 0.7000000001.
  const [hue, saturation, brightness] = [
    adjust.hue,
    adjust.saturation,
    adjust.brightness,
  ].map((n) => Math.round(n * 100) / 100);
  const parts = [
    hue !== 0 && `hue-rotate(${hue}deg)`,
    saturation !== 1 && `saturate(${saturation})`,
    brightness !== 1 && `brightness(${brightness})`,
  ].filter(Boolean);
  return parts.length ? parts.join(" ") : null;
}

function LogoOption({
  name,
  filter,
  selected,
  onSelect,
  background,
}: {
  name: string;
  filter: string | null;
  selected: boolean;
  onSelect: () => void;
  background: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "hover:border-border-focus/60 focus-visible:ring-border-focus flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border p-2 transition-colors focus-visible:ring-2 focus-visible:outline-none",
        selected
          ? "border-button-info ring-button-info/30 ring-2"
          : "border-border-card",
      )}
    >
      <span
        className="flex h-12 w-full items-center justify-center rounded-md"
        style={{ background }}
      >
        <Image
          src="/logos/JBCL_Header.webp"
          alt=""
          width={256}
          height={58}
          className="h-auto max-h-10 w-full object-contain"
          style={{ filter: filter ?? "none" }}
        />
      </span>
      <span
        className={cn(
          "text-xs font-medium",
          selected ? "text-primary-text" : "text-secondary-text",
        )}
      >
        {name}
      </span>
    </button>
  );
}

/** The logo filter that turns its blue into a color (#rrggbb), or null if invalid. */
export function matchLogoFilter(hex: string): string | null {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return null;
  return buildFilter({
    ...ORIGINAL,
    hue: Math.round(wrapHue(hexToHsv(hex).h - LOGO_HUE)),
  });
}

/**
 * Picks the logo's color by clicking a finished logo: matched to the theme's
 * buttons, or a preset. Fine-tune holds a color wheel and vividness for the
 * rest. `value` is the CSS filter, or null for the original logo.
 */
export default function LogoFilterBuilder({
  value,
  onChange,
  onPreview,
  background,
  matchColor,
  matching,
  onMatchingChange,
}: {
  value: string | null;
  onChange: (filter: string | null) => void;
  onPreview: (filter: string | null) => void;
  /** The theme's header color, behind the logos. */
  background: string;
  /** The theme's button color as #rrggbb, for "Match buttons". */
  matchColor: string;
  /** Whether the logo follows the button color; the editor keeps it updated. */
  matching: boolean;
  onMatchingChange: (matching: boolean) => void;
}) {
  const [dragHue, setDragHue] = useState<number | null>(null);
  const adjust = parseFilter(value);
  if (dragHue !== null) adjust.hue = dragHue;
  const drag = useRef<{ frame: number | null; hue: number; active: boolean }>({
    frame: null,
    hue: 0,
    active: false,
  });
  const cancelFrame = () => {
    if (drag.current.frame !== null) cancelAnimationFrame(drag.current.frame);
    drag.current.frame = null;
  };
  useEffect(() => cancelFrame, []);
  // Any other choice stops following the buttons.
  const pick = (filter: string | null) => {
    cancelFrame();
    drag.current.active = false;
    setDragHue(null);
    if (!matching && filter === value) return;
    onMatchingChange(false);
    onChange(filter);
  };
  const set = (change: Partial<LogoAdjustments>) =>
    pick(buildFilter({ ...adjust, ...change }));

  const pickFromPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    if (x === 0 && y === 0) return;
    drag.current.hue = wrapHue(Math.round((Math.atan2(x, -y) * 180) / Math.PI));
    if (drag.current.frame === null) {
      drag.current.frame = requestAnimationFrame(() => {
        drag.current.frame = null;
        setDragHue(drag.current.hue);
        onPreview(buildFilter({ ...adjust, hue: drag.current.hue }));
      });
    }
  };

  const options = [
    {
      name: "Match buttons",
      filter: matchLogoFilter(matchColor),
      selected: matching && dragHue === null,
      onSelect: () => {
        cancelFrame();
        drag.current.active = false;
        setDragHue(null);
        onMatchingChange(true);
        onChange(matchLogoFilter(matchColor));
      },
    },
    ...PRESETS.map(({ name, adjust: preset }) => {
      const filter = buildFilter(preset);
      return {
        name,
        filter,
        selected: dragHue === null && !matching && value === filter,
        onSelect: () => pick(filter),
      };
    }),
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 @md:grid-cols-4">
        {options.map((option) => (
          <LogoOption
            key={option.name}
            name={option.name}
            filter={option.filter}
            selected={option.selected}
            onSelect={option.onSelect}
            background={background}
          />
        ))}
      </div>

      <details className="group">
        <summary className="text-link cursor-pointer text-sm font-medium">
          Fine-tune the logo color
        </summary>
        <div
          className="border-border-card mt-3 flex h-24 items-center justify-center rounded-lg border px-6"
          style={{ background }}
        >
          <Image
            src="/logos/JBCL_Header.webp"
            alt="Logo color preview"
            width={256}
            height={58}
            className="h-auto w-full max-w-xs"
            style={{ filter: buildFilter(adjust) ?? "none" }}
          />
        </div>
        <div className="mt-3 grid gap-4 @md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-primary-text">Color</span>
              <span className="text-secondary-text tabular-nums">
                {adjust.hue === 0
                  ? "Original"
                  : `${adjust.hue > 0 ? "+" : ""}${adjust.hue}°`}
              </span>
            </div>
            <div
              role="slider"
              tabIndex={0}
              aria-label="Logo color"
              aria-valuemin={-180}
              aria-valuemax={180}
              aria-valuenow={adjust.hue}
              aria-valuetext={
                adjust.hue === 0 ? "Original" : `${adjust.hue} degrees`
              }
              onPointerDown={(event) => {
                if (event.button !== 0) return;
                drag.current.active = true;
                drag.current.hue = adjust.hue;
                event.currentTarget.focus();
                event.currentTarget.setPointerCapture(event.pointerId);
                pickFromPointer(event);
              }}
              onPointerMove={(event) => {
                if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                  pickFromPointer(event);
                }
              }}
              onPointerUp={(event) => {
                if (!event.currentTarget.hasPointerCapture(event.pointerId))
                  return;
                pickFromPointer(event);
                set({ hue: drag.current.hue });
                event.currentTarget.releasePointerCapture(event.pointerId);
              }}
              onPointerCancel={() => {
                if (drag.current.active) set({ hue: drag.current.hue });
              }}
              onLostPointerCapture={() => {
                if (drag.current.active) set({ hue: drag.current.hue });
              }}
              onKeyDown={(event) => {
                const step = event.shiftKey ? 15 : 5;
                const keys: Record<string, number> = {
                  ArrowRight: wrapHue(adjust.hue + step),
                  ArrowUp: wrapHue(adjust.hue + step),
                  ArrowLeft: wrapHue(adjust.hue - step),
                  ArrowDown: wrapHue(adjust.hue - step),
                  Home: -180,
                  End: 180,
                };
                if (event.key in keys) {
                  event.preventDefault();
                  set({ hue: keys[event.key] });
                }
              }}
              className="focus-visible:ring-border-focus relative mx-auto size-40 cursor-crosshair touch-none rounded-full focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              style={{
                background: `conic-gradient(${[0, 60, 120, 180, 240, 300, 360]
                  .map((d) => `hsl(${LOGO_HUE + d} 80% 55%)`)
                  .join(", ")})`,
              }}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-[16%] rounded-full"
                style={{ background }}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
                style={{
                  left: `${50 + 42 * Math.sin((adjust.hue * Math.PI) / 180)}%`,
                  top: `${50 - 42 * Math.cos((adjust.hue * Math.PI) / 180)}%`,
                }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-primary-text">Vividness</span>
              <span className="text-secondary-text tabular-nums">
                {Math.round(adjust.saturation * 100)}%
              </span>
            </div>
            <Slider
              value={[adjust.saturation]}
              min={0}
              max={2}
              step={0.05}
              onValueChange={([saturation]) => set({ saturation })}
              aria-label="Logo vividness"
            />
          </div>
        </div>
      </details>
    </div>
  );
}
