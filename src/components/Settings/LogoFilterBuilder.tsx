"use client";

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
        className="flex h-10 w-full items-center justify-center rounded-md px-2"
        style={{ background }}
      >
        <Image
          src="/logos/JBCL_Header.webp"
          alt=""
          width={256}
          height={58}
          className="h-5 w-auto"
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
 * buttons, or a preset. Fine-tune holds a color strip and vividness for the
 * rest. `value` is the CSS filter, or null for the original logo.
 */
export default function LogoFilterBuilder({
  value,
  onChange,
  background,
  matchColor,
  matching,
  onMatchingChange,
}: {
  value: string | null;
  onChange: (filter: string | null) => void;
  /** The theme's header color, behind the logos. */
  background: string;
  /** The theme's button color as #rrggbb, for "Match buttons". */
  matchColor: string;
  /** Whether the logo follows the button color; the editor keeps it updated. */
  matching: boolean;
  onMatchingChange: (matching: boolean) => void;
}) {
  const adjust = parseFilter(value);
  // Any other choice stops following the buttons.
  const pick = (filter: string | null) => {
    onMatchingChange(false);
    onChange(filter);
  };
  const set = (change: Partial<LogoAdjustments>) =>
    pick(buildFilter({ ...adjust, ...change }));

  const options = [
    {
      name: "Match buttons",
      filter: matchLogoFilter(matchColor),
      selected: matching,
      onSelect: () => {
        onMatchingChange(true);
        onChange(matchLogoFilter(matchColor));
      },
    },
    ...PRESETS.map(({ name, adjust: preset }) => {
      const filter = buildFilter(preset);
      return {
        name,
        filter,
        selected: !matching && value === filter,
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
            {/* Sized like the Slider beside it, whose height is just its 6px
                track (the thumb overhangs). The track shows the logo color
                each spot gives. */}
            <div className="flex h-1.5 items-center">
              <input
                type="range"
                min={-180}
                max={180}
                step={5}
                value={adjust.hue}
                onChange={(event) => set({ hue: Number(event.target.value) })}
                aria-label="Logo color"
                className="focus-visible:[&::-webkit-slider-thumb]:ring-border-focus h-1.5 w-full cursor-pointer appearance-none rounded-full focus-visible:outline-none [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-transparent [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md focus-visible:[&::-webkit-slider-thumb]:ring-2"
                style={{
                  background: `linear-gradient(to right, ${[
                    -180, -120, -60, 0, 60, 120, 180,
                  ]
                    .map((d) => `hsl(${LOGO_HUE + d} 80% 55%)`)
                    .join(", ")})`,
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
