"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/IconWrapper";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { hexToHsv, hsvToHex } from "@/utils/ui/accentColor";

interface LogoAdjustments {
  /** Degrees around the color wheel, -180 to 180. */
  hue: number;
  /** 1 keeps the colors; lower is softer, higher is more vivid. */
  saturation: number;
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
    hue:
      Math.round(wrapHue(number(/hue-rotate\((-?[\d.]+)deg\)/, 0)) * 100) / 100,
    saturation: number(/saturate\(([\d.]+)\)/, 1),
    brightness: number(/brightness\(([\d.]+)\)/, 1),
  };
}

/** Any angle as -180 to 180; hue-rotate(270deg) is the same as -90deg. */
const wrapHue = (hue: number) => ((((hue + 180) % 360) + 360) % 360) - 180;

function wheelColor(hue: number, saturation: number, brightness: number) {
  return hsvToHex({
    h: (LOGO_HUE + hue + 360) % 360,
    s: Math.min(1, Math.max(0, saturation / 2)),
    v: Math.min(1, Math.max(0, brightness)),
  }).toUpperCase();
}

function wheelPosition(hue: number, saturation: number) {
  const angle = (hue * Math.PI) / 180;
  const radius = Math.min(2, Math.max(0, saturation)) * 25;
  return `translate3d(${Math.sin(angle) * radius}cqw, ${-Math.cos(angle) * radius}cqw, 0)`;
}

/** The CSS filter for the adjustments, or null when the logo is unchanged. */
function buildFilter(adjust: LogoAdjustments) {
  // Slider steps leave float noise like 0.7000000001.
  const [hue, saturation, brightness] = [
    adjust.hue,
    adjust.saturation,
    adjust.brightness,
  ].map((n, index) => Number(n.toFixed(index === 0 ? 2 : 4)));
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
  const instructionsId = useId();
  const [dragging, setDragging] = useState(false);
  const [hexInvalid, setHexInvalid] = useState(false);
  const [screenPickerSupported, setScreenPickerSupported] = useState(false);
  const [pickingScreen, setPickingScreen] = useState(false);
  useEffect(() => setScreenPickerSupported("EyeDropper" in window), []);
  const adjust = parseFilter(value);
  const handleRef = useRef<HTMLSpanElement>(null);
  const previewRef = useRef<HTMLImageElement>(null);
  const hexInputRef = useRef<HTMLInputElement>(null);
  const swatchRef = useRef<HTMLButtonElement>(null);
  const editingHex = useRef(false);
  const screenPick = useRef<AbortController | null>(null);
  const color = wheelColor(adjust.hue, adjust.saturation, adjust.brightness);
  useEffect(() => {
    if (hexInputRef.current && !editingHex.current) {
      hexInputRef.current.value = color.slice(1);
      setHexInvalid(false);
    }
  }, [color]);
  const drag = useRef<{
    frame: number | null;
    hue: number;
    saturation: number;
    active: boolean;
    rect: DOMRect | null;
  }>({
    frame: null,
    hue: 0,
    saturation: 1,
    active: false,
    rect: null,
  });
  const cancelFrame = () => {
    if (drag.current.frame !== null) cancelAnimationFrame(drag.current.frame);
    drag.current.frame = null;
  };
  useEffect(
    () => () => {
      cancelFrame();
      screenPick.current?.abort();
    },
    [],
  );
  const syncHexInput = (filter: string | null) => {
    setHexInvalid(false);
    if (hexInputRef.current && !editingHex.current) {
      const next = parseFilter(filter);
      hexInputRef.current.value = wheelColor(
        next.hue,
        next.saturation,
        next.brightness,
      ).slice(1);
    }
  };
  // Any other choice stops following the buttons.
  const pick = (filter: string | null) => {
    cancelFrame();
    drag.current.active = false;
    setDragging(false);
    syncHexInput(filter);
    if (!matching && filter === value) return;
    onMatchingChange(false);
    onChange(filter);
  };
  const set = (change: Partial<LogoAdjustments>) =>
    pick(buildFilter({ ...adjust, ...change }));

  const applyHex = (input: HTMLInputElement) => {
    const hex = `#${input.value.trim().replace(/^#/, "")}`;
    if (!/^#[0-9a-f]{6}$/i.test(hex)) {
      setHexInvalid(true);
      return;
    }
    setHexInvalid(false);
    if (!editingHex.current) input.value = hex.slice(1).toUpperCase();
    if (hex.toUpperCase() === color) return;
    const hsv = hexToHsv(hex);
    set({
      hue: hsv.s === 0 ? adjust.hue : wrapHue(hsv.h - LOGO_HUE),
      saturation: hsv.s * 2,
      brightness: hsv.v,
    });
  };
  const pickScreenColor = async () => {
    const EyeDropper = (
      window as Window & {
        EyeDropper?: new () => {
          open: (options: {
            signal: AbortSignal;
          }) => Promise<{ sRGBHex: string }>;
        };
      }
    ).EyeDropper;
    if (!EyeDropper || screenPick.current) return;
    const controller = new AbortController();
    screenPick.current = controller;
    setPickingScreen(true);
    try {
      const { sRGBHex } = await new EyeDropper().open({
        signal: controller.signal,
      });
      if (controller.signal.aborted || !hexInputRef.current) return;
      editingHex.current = false;
      hexInputRef.current.value = sRGBHex.slice(1);
      applyHex(hexInputRef.current);
    } catch (error) {
      if (
        !controller.signal.aborted &&
        !(error instanceof DOMException && error.name === "AbortError")
      ) {
        toast.error("Couldn't pick a color from the screen");
      }
    } finally {
      screenPick.current = null;
      if (!controller.signal.aborted) setPickingScreen(false);
    }
  };
  const copyColor = async () => {
    try {
      await navigator.clipboard.writeText(color);
      toast.success("Color copied");
    } catch {
      toast.error("Couldn't copy the color");
    }
  };

  const previewHue = (wheel: HTMLDivElement) => {
    const hue = drag.current.hue;
    const rounded = Math.round(hue * 100) / 100;
    const saturation = drag.current.saturation;
    const vividness = Math.round(saturation * 100);
    const color = wheelColor(hue, saturation, adjust.brightness);
    const filter = buildFilter({ ...adjust, hue, saturation });
    if (previewRef.current) previewRef.current.style.filter = filter ?? "none";
    if (hexInputRef.current) hexInputRef.current.value = color.slice(1);
    if (swatchRef.current) swatchRef.current.style.backgroundColor = color;
    wheel.setAttribute("aria-valuenow", String(rounded));
    wheel.setAttribute("aria-valuetext", `${color}, vividness ${vividness}%`);
    onPreview(filter);
  };

  const pickFromPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = drag.current.rect;
    if (!rect) return;
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    const distance = Math.hypot(x, y);
    if (distance > 0)
      drag.current.hue = wrapHue((Math.atan2(x, -y) * 180) / Math.PI);
    drag.current.saturation = Math.min(2, (distance / (rect.width / 2)) * 2);
    if (handleRef.current) {
      handleRef.current.style.transform = wheelPosition(
        drag.current.hue,
        drag.current.saturation,
      );
    }
    if (drag.current.frame === null) {
      const wheel = event.currentTarget;
      drag.current.frame = requestAnimationFrame(() => {
        drag.current.frame = null;
        previewHue(wheel);
      });
    }
  };

  const finishDrag = (wheel: HTMLDivElement) => {
    if (!drag.current.active) return;
    previewHue(wheel);
    set({ hue: drag.current.hue, saturation: drag.current.saturation });
  };

  const options = [
    {
      name: "Match buttons",
      filter: matchLogoFilter(matchColor),
      selected: matching && !dragging,
      onSelect: () => {
        cancelFrame();
        drag.current.active = false;
        setDragging(false);
        syncHexInput(matchLogoFilter(matchColor));
        onMatchingChange(true);
        onChange(matchLogoFilter(matchColor));
      },
    },
    ...PRESETS.map(({ name, adjust: preset }) => {
      const filter = buildFilter(preset);
      return {
        name,
        filter,
        selected: !dragging && !matching && value === filter,
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
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-secondary-text text-xs">Logo preview</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              editingHex.current = false;
              pick(null);
            }}
          >
            Reset to original
          </Button>
        </div>
        <div
          className="border-border-card mt-2 flex h-24 items-center justify-center rounded-lg border px-6"
          style={{ background }}
        >
          <Image
            src="/logos/JBCL_Header.webp"
            ref={previewRef}
            alt="Logo color preview"
            width={256}
            height={58}
            className="h-auto w-full max-w-xs"
            style={{ filter: buildFilter(adjust) ?? "none" }}
          />
        </div>
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3 text-sm">
            <div className="space-y-1.5">
              <label
                htmlFor={`${instructionsId}-hex`}
                className="text-primary-text"
              >
                Selected color
              </label>
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      ref={swatchRef}
                      type="button"
                      aria-label="Copy selected color"
                      onClick={copyColor}
                      className="border-border-card focus-visible:ring-border-focus size-8 shrink-0 cursor-pointer rounded-md border focus-visible:ring-2 focus-visible:outline-none"
                      style={{ backgroundColor: color }}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Copy color</TooltipContent>
                </Tooltip>
                <div className="relative">
                  <span
                    aria-hidden="true"
                    className="text-secondary-text pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 font-mono"
                  >
                    #
                  </span>
                  <Input
                    id={`${instructionsId}-hex`}
                    ref={hexInputRef}
                    aria-label="Selected color hex"
                    defaultValue={color.slice(1)}
                    placeholder="RRGGBB"
                    maxLength={6}
                    spellCheck={false}
                    autoComplete="off"
                    aria-invalid={hexInvalid}
                    aria-describedby={
                      hexInvalid ? `${instructionsId}-hex-error` : undefined
                    }
                    className="aria-invalid:border-form-error aria-invalid:focus:border-form-error aria-invalid:focus-visible:ring-form-error h-8 w-28 pr-2 pl-6 font-mono uppercase"
                    onFocus={() => {
                      editingHex.current = true;
                    }}
                    onChange={(event) => {
                      const input = event.currentTarget;
                      const text = input.value.trim();
                      setHexInvalid(/[^0-9a-f]/i.test(text));
                      if (/^[0-9a-f]{6}$/i.test(text)) applyHex(input);
                    }}
                    onPaste={(event) => {
                      const text = event.clipboardData.getData("text").trim();
                      if (/^#[0-9a-f]{6}$/i.test(text)) {
                        event.preventDefault();
                        event.currentTarget.value = text.slice(1);
                        applyHex(event.currentTarget);
                      }
                    }}
                    onBlur={(event) => {
                      editingHex.current = false;
                      applyHex(event.currentTarget);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        applyHex(event.currentTarget);
                      } else if (event.key === "Escape") {
                        event.preventDefault();
                        event.stopPropagation();
                        event.currentTarget.value = color.slice(1);
                        setHexInvalid(false);
                      }
                    }}
                  />
                </div>
                {screenPickerSupported && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8!"
                        aria-label="Pick color from screen"
                        disabled={pickingScreen}
                        onClick={pickScreenColor}
                      >
                        <Icon icon="lucide:pipette" aria-hidden="true" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      Pick color from screen
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <p
                id={`${instructionsId}-hex-error`}
                role="status"
                className="text-form-error min-h-4 text-xs"
              >
                {hexInvalid ? "Use 6 hex digits, e.g. #5865F2." : ""}
              </p>
            </div>
          </div>
          <div
            role="slider"
            tabIndex={0}
            aria-label="Logo color"
            aria-valuemin={-180}
            aria-valuemax={180}
            aria-valuenow={adjust.hue}
            aria-valuetext={`${color}, vividness ${Math.round(adjust.saturation * 100)}%`}
            aria-describedby={instructionsId}
            onPointerDown={(event) => {
              if (event.button !== 0) return;
              drag.current.active = true;
              drag.current.hue = adjust.hue;
              drag.current.saturation = adjust.saturation;
              setDragging(true);
              event.currentTarget.focus({ preventScroll: true });
              setHexInvalid(false);
              drag.current.rect = event.currentTarget.getBoundingClientRect();
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
              finishDrag(event.currentTarget);
              event.currentTarget.releasePointerCapture(event.pointerId);
            }}
            onPointerCancel={(event) => finishDrag(event.currentTarget)}
            onLostPointerCapture={(event) => finishDrag(event.currentTarget)}
            onKeyDown={(event) => {
              const step = event.shiftKey ? 15 : 5;
              const hue = drag.current.active ? drag.current.hue : adjust.hue;
              const saturation = drag.current.active
                ? drag.current.saturation
                : adjust.saturation;
              const vividnessStep = event.shiftKey ? 0.15 : 0.05;
              const keys: Record<string, Partial<LogoAdjustments>> = {
                ArrowRight: { hue: wrapHue(hue + step) },
                ArrowLeft: { hue: wrapHue(hue - step) },
                ArrowUp: {
                  saturation: Math.min(2, saturation + vividnessStep),
                },
                ArrowDown: {
                  saturation: Math.max(0, saturation - vividnessStep),
                },
                Home: { hue: -180 },
                End: { hue: 180 },
              };
              if (Object.hasOwn(keys, event.key)) {
                event.preventDefault();
                set({ hue, saturation, ...keys[event.key] });
              }
            }}
            className="focus-visible:ring-border-focus @container relative mx-auto aspect-square w-64 max-w-full cursor-crosshair touch-none rounded-full focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            style={{
              background: `radial-gradient(closest-side, #fff, transparent), conic-gradient(from ${-LOGO_HUE}deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)`,
            }}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-full bg-black"
              style={{
                opacity: 1 - Math.min(1, Math.max(0, adjust.brightness)),
              }}
            />
            <span
              ref={handleRef}
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)] will-change-transform"
              style={{
                transform: wheelPosition(adjust.hue, adjust.saturation),
              }}
            />
          </div>
          <p id={instructionsId} className="sr-only">
            Left and right arrows change color; up and down arrows change
            vividness.
          </p>
        </div>
      </details>
    </div>
  );
}
