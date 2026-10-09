"use client";

import { useId, useRef, useState } from "react";
import SupporterModal from "@/components/Modals/SupporterModal";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { getProfileBanner } from "@/components/Profile/Banner";
import { appearanceProfileKey } from "@/hooks/useAccentColor";
import { useSupporterModal } from "@/hooks/useSupporterModal";
import type { UserData } from "@/types/auth";
import { fetchUserById, PUBLIC_API_URL } from "@/utils/api/api";
import { UserAvatar } from "@/utils/ui/avatar";
import {
  ACCENT_STYLES,
  accentCardTheme,
  hexToHsv,
  hsvToHex,
  type Accent,
  type AccentStyle,
  type Hsv,
} from "@/utils/ui/accentColor";
import { Icon } from "@/components/ui/IconWrapper";

const PRESETS = [
  "#5865f2",
  "#2462cd",
  "#1abc9c",
  "#3ba55c",
  "#fee75c",
  "#faa61a",
  "#e67e22",
  "#ed4245",
  "#eb459e",
  "#9b59b6",
  "#99aab5",
  "#23272a",
];
const DEFAULT_COLOR = "#2462cd";
const clamp = (n: number) => Math.min(1, Math.max(0, n));

/** An in-page color picker: saturation/brightness square, hue, presets, hex. */
function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (hex: string) => void;
}) {
  // Kept as HSV so the hue survives when the color is gray or black.
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(value));
  const [hexText, setHexText] = useState(value);
  const areaRef = useRef<HTMLDivElement>(null);

  const update = (next: Hsv) => {
    setHsv(next);
    const hex = hsvToHex(next);
    setHexText(hex);
    onChange(hex);
  };

  const pickFromPointer = (event: React.PointerEvent) => {
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect) return;
    update({
      ...hsv,
      s: clamp((event.clientX - rect.left) / rect.width),
      v: clamp(1 - (event.clientY - rect.top) / rect.height),
    });
  };

  return (
    <div className="space-y-3">
      <div
        ref={areaRef}
        role="slider"
        tabIndex={0}
        aria-label="Saturation and brightness"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(hsv.s * 100)}
        aria-valuetext={`Saturation ${Math.round(hsv.s * 100)}%, brightness ${Math.round(hsv.v * 100)}%`}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          pickFromPointer(event);
        }}
        onPointerMove={(event) => {
          if (event.buttons) pickFromPointer(event);
        }}
        onKeyDown={(event) => {
          const step = event.shiftKey ? 0.1 : 0.02;
          const moves: Record<string, Partial<Hsv>> = {
            ArrowLeft: { s: clamp(hsv.s - step) },
            ArrowRight: { s: clamp(hsv.s + step) },
            ArrowUp: { v: clamp(hsv.v + step) },
            ArrowDown: { v: clamp(hsv.v - step) },
          };
          if (moves[event.key]) {
            event.preventDefault();
            update({ ...hsv, ...moves[event.key] });
          }
        }}
        className="focus-visible:ring-border-focus relative h-36 w-full cursor-crosshair touch-none rounded-lg focus-visible:ring-2 focus-visible:outline-none"
        style={{
          background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.h} 100% 50%))`,
        }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
          style={{
            left: `${hsv.s * 100}%`,
            top: `${(1 - hsv.v) * 100}%`,
            backgroundColor: hsvToHex(hsv),
          }}
        />
      </div>

      <input
        type="range"
        min={0}
        max={359}
        value={Math.round(hsv.h)}
        onChange={(event) => update({ ...hsv, h: Number(event.target.value) })}
        aria-label="Hue"
        className="h-3 w-full cursor-pointer appearance-none rounded-full [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-transparent [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
        style={{
          background:
            "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
        }}
      />

      <div className="grid grid-cols-6 gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => update(hexToHsv(preset))}
            aria-label={`Use ${preset}`}
            className="focus-visible:ring-border-focus aspect-square cursor-pointer rounded-md border border-black/20 transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:outline-none"
            style={{ backgroundColor: preset }}
          />
        ))}
      </div>

      <label className="flex items-center gap-2">
        <span className="text-secondary-text text-xs font-medium">Hex</span>
        <input
          type="text"
          value={hexText}
          maxLength={7}
          spellCheck={false}
          onChange={(event) => {
            const text = event.target.value.trim();
            setHexText(text);
            const normalized = text.startsWith("#") ? text : `#${text}`;
            if (/^#[0-9a-f]{6}$/i.test(normalized)) {
              update(hexToHsv(normalized.toLowerCase()));
            }
          }}
          className="border-border-card bg-tertiary-bg text-primary-text focus:border-button-info h-8 w-full rounded-md border px-2 font-mono text-sm outline-none"
        />
      </label>
    </div>
  );
}

/** A labelled swatch showing its hex; opens a ColorPicker once `canOpen` allows it. */
function ColorSwatch({
  label,
  value,
  onChange,
  canOpen,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  canOpen: () => boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={(next) => setOpen(next && canOpen())}>
      <PopoverTrigger className="border-border-card bg-secondary-bg hover:border-border-focus/60 focus-visible:ring-border-focus flex cursor-pointer items-center gap-2.5 rounded-lg border py-1.5 pr-3 pl-1.5 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none">
        <span
          aria-hidden="true"
          className="size-8 shrink-0 rounded-md border border-black/20 shadow-inner"
          style={{ backgroundColor: value }}
        />
        <span>
          <span className="text-secondary-text block text-xs">{label}</span>
          <span className="text-primary-text block font-mono text-sm uppercase">
            {value}
          </span>
        </span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-3">
        <ColorPicker value={value} onChange={onChange} />
      </PopoverContent>
    </Popover>
  );
}

const STYLE_NAMES: Record<AccentStyle, string> = {
  solid: "Solid",
  glass: "Glass",
  transparent: "Transparent",
};

const segment =
  "text-secondary-text has-checked:bg-button-info has-checked:text-form-button-text has-focus-visible:ring-border-focus cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors has-focus-visible:ring-2";

interface AccentColorSettingProps {
  /** The accent the profile shows right now, or null if none. */
  accent: Accent | null;
  /** Only the custom accent; null means the Discord color is in use. */
  customAccent: Accent | null;
  onChange: (accent: Accent) => void;
  onReset: () => void;
  userData: UserData;
}

export function AccentColorSetting({
  accent,
  customAccent,
  onChange,
  onReset,
  userData,
}: AccentColorSettingProps) {
  const id = useId();
  const premiumType = userData.premiumtype ?? 0;
  const { modalState, closeModal, checkAccentColorAccess } =
    useSupporterModal();
  const canEdit = () => checkAccentColorAccess(premiumType);
  // The style previews show the user's own banner, avatar and name. /v2/users/me
  // has no custom banner, so read the public profile (shared with the preview).
  const { data: profile } = useQuery({
    queryKey: appearanceProfileKey(userData.id),
    queryFn: () =>
      fetchUserById(userData.id, PUBLIC_API_URL) as Promise<{
        avatar?: string | null;
        banner?: string | null;
        custom_avatar?: string | null;
        custom_banner?: string | null;
      }>,
    staleTime: 60_000,
  });
  const banner = getProfileBanner({
    userId: userData.id,
    banner: profile?.banner ?? userData.banner,
    customBanner: profile?.custom_banner ?? userData.custom_banner,
    settings: userData.settings_v2,
    premiumType,
    size: 600,
  });
  const name =
    userData.global_name && userData.global_name !== "None"
      ? userData.global_name
      : userData.username;
  const current = accent ?? {
    color: DEFAULT_COLOR,
    gradient: null,
    style: "solid" as const,
  };
  const update = (patch: Partial<Accent>) => onChange({ ...current, ...patch });
  const setGradient = (on: boolean) => {
    if (!canEdit()) return;
    // Start the gradient a little further round the color wheel.
    const hsv = hexToHsv(current.color);
    update({
      gradient: on ? hsvToHex({ ...hsv, h: (hsv.h + 60) % 360 }) : null,
    });
  };

  return (
    <div className="-mx-3 mb-1 space-y-5 rounded-lg px-3 py-2">
      <div>
        <p className="text-primary-text text-base font-medium">Accent color</p>
        <p className="text-secondary-text text-sm">
          Choose the color and style of your profile cards.{" "}
          {customAccent
            ? "Using your custom color."
            : "Using your Discord color."}
          {customAccent && (
            <>
              {" "}
              <button
                type="button"
                onClick={onReset}
                className="text-link hover:text-link-hover cursor-pointer underline-offset-4 hover:underline"
              >
                Reset to Discord color
              </button>
            </>
          )}
        </p>
      </div>

      <div role="group" aria-labelledby={`${id}-color`}>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p
            id={`${id}-color`}
            className="text-primary-text text-sm font-medium"
          >
            Color
          </p>
          <div
            role="radiogroup"
            aria-label="Fill"
            className="border-border-card bg-tertiary-bg inline-flex rounded-lg border p-0.5"
          >
            {(
              [
                [false, "Single color"],
                [true, "Gradient"],
              ] as const
            ).map(([gradient, label]) => (
              <label key={label} className={segment}>
                <input
                  type="radio"
                  name={`${id}-fill`}
                  checked={!!current.gradient === gradient}
                  onChange={() => setGradient(gradient)}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div className="border-border-card bg-tertiary-bg flex flex-wrap items-center gap-2 rounded-xl border p-2 sm:flex-nowrap">
          <ColorSwatch
            label={current.gradient ? "Start" : "Color"}
            value={current.color}
            onChange={(color) => update({ color })}
            canOpen={canEdit}
          />
          {/* Runs left to right so its ends line up with the swatches. On
              small screens it sits above them, full width. */}
          <div
            className="relative order-first grid h-11 min-w-0 flex-1 basis-full place-items-center rounded-lg border border-black/10 shadow-inner sm:order-none sm:basis-0"
            style={{
              background: current.gradient
                ? `linear-gradient(90deg, ${current.color}, ${current.gradient}) border-box`
                : current.color,
            }}
          >
            {current.gradient && (
              <button
                type="button"
                aria-label="Swap start and end colors"
                onClick={() =>
                  canEdit() &&
                  update({ color: current.gradient!, gradient: current.color })
                }
                className="border-border-card bg-secondary-bg text-secondary-text hover:text-primary-text focus-visible:ring-border-focus cursor-pointer rounded-full border p-1.5 shadow-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                <Icon
                  icon="lucide:arrow-left-right"
                  aria-hidden="true"
                  className="size-3.5"
                />
              </button>
            )}
          </div>
          {current.gradient && (
            <div className="ml-auto sm:ml-0">
              <ColorSwatch
                label="End"
                value={current.gradient}
                onChange={(gradient) => update({ gradient })}
                canOpen={canEdit}
              />
            </div>
          )}
        </div>
      </div>

      <fieldset>
        <legend className="text-primary-text mb-2 text-sm font-medium">
          Card style
        </legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {ACCENT_STYLES.map((style) => (
            <label
              key={style}
              className="group border-border-card has-checked:border-button-info has-focus-visible:ring-border-focus hover:border-border-focus/60 cursor-pointer overflow-hidden rounded-lg border transition-colors has-focus-visible:ring-2"
            >
              <input
                type="radio"
                name={`${id}-style`}
                value={style}
                checked={current.style === style}
                onChange={() => canEdit() && update({ style })}
                className="sr-only"
              />
              {/* Your own card in this style, over your banner. */}
              <span
                aria-hidden="true"
                data-accent-cards={style}
                style={accentCardTheme({ ...current, style })}
                className="relative flex h-20 items-end p-2"
              >
                <Image
                  src={banner.primary ?? banner.fallback}
                  alt=""
                  fill
                  sizes="200px"
                  draggable={false}
                  className="object-cover"
                />
                <span className="bg-secondary-bg border-border-card relative flex w-full min-w-0 items-center gap-1.5 rounded-md border p-1.5">
                  <UserAvatar
                    userId={userData.id}
                    avatarHash={profile?.avatar ?? userData.avatar}
                    username={userData.username}
                    size={5}
                    custom_avatar={
                      (profile?.custom_avatar ?? userData.custom_avatar) ||
                      undefined
                    }
                    settings={userData.settings_v2}
                    premiumType={premiumType}
                    showBadge={false}
                  />
                  <span className="text-primary-text truncate text-xs font-semibold">
                    {name}
                  </span>
                </span>
              </span>
              <span className="border-border-card group-has-checked:bg-button-info/10 flex items-center justify-between gap-2 border-t px-2.5 py-1.5">
                <span className="text-primary-text text-sm">
                  {STYLE_NAMES[style]}
                </span>
                <span
                  aria-hidden="true"
                  className="border-border-card group-has-checked:border-button-info group-has-checked:bg-button-info size-3.5 shrink-0 rounded-full border-2 transition-colors group-has-checked:shadow-[inset_0_0_0_2px_var(--color-secondary-bg)]"
                />
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <SupporterModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        feature={modalState.feature}
        currentTier={modalState.currentTier}
        requiredTier={modalState.requiredTier}
        currentLimit={modalState.currentLimit}
        requiredLimit={modalState.requiredLimit}
      />
    </div>
  );
}
