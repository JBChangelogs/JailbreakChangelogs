import type { CSSProperties } from "react";

/**
 * Converts a user's accent_color to "#rrggbb". The API sends an integer
 * 0xRRGGBB (Discord style); a decimal string is the same number, anything
 * else is treated as hex. Returns null when there's no color.
 */
export function accentColorToHex(
  color: number | string | null | undefined,
): string | null {
  if (color === null || color === undefined) return null;
  if (color === "" || color === "None" || color === "0" || color === 0) {
    return null;
  }
  if (typeof color === "number" || /^\d+$/.test(color)) {
    return `#${Number(color).toString(16).padStart(6, "0")}`;
  }
  const hex = color.replace(/^#/, "");
  return /^[0-9a-f]{6}$/i.test(hex) ? `#${hex.toLowerCase()}` : null;
}

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * Black or white, whichever contrasts more with every one of `hexes` (WCAG),
 * so text stays readable across both ends of a gradient.
 */
export function readableTextColor(
  ...hexes: [string, ...string[]]
): "#000000" | "#ffffff" {
  const ls = hexes.map(luminance);
  const onBlack = Math.min(...ls.map((l) => (l + 0.05) / 0.05));
  const onWhite = Math.min(...ls.map((l) => 1.05 / (l + 0.05)));
  return onBlack > onWhite ? "#000000" : "#ffffff";
}

export const ACCENT_STYLES = ["solid", "glass", "transparent"] as const;
export type AccentStyle = (typeof ACCENT_STYLES)[number];

/** A profile card accent: "#rrggbb" colors, plus how the card is filled. */
export interface Accent {
  color: string;
  /** End color of a gradient from `color`; null for a solid color. */
  gradient: string | null;
  style: AccentStyle;
}

export const toAccentStyle = (style: unknown): AccentStyle =>
  ACCENT_STYLES.includes(style as AccentStyle)
    ? (style as AccentStyle)
    : "solid";

/**
 * The accent a user's cards are colored with, or null when they haven't
 * turned on colored profile cards. Missing fields count as no gradient and
 * the solid style.
 */
export function userCardAccent(user: {
  settings_v2?: { colored_profile_cards?: boolean } | null;
  accent_color?: number | string | null;
  custom_accent_color?: number | string | null;
  accent_gradient?: number | string | null;
  accent_style?: string | null;
}): Accent | null {
  if (user.settings_v2?.colored_profile_cards !== true) return null;
  const color =
    accentColorToHex(user.custom_accent_color) ??
    accentColorToHex(user.accent_color);
  if (!color) return null;
  return {
    color,
    gradient: accentColorToHex(user.accent_gradient),
    style: toAccentStyle(user.accent_style),
  };
}

/**
 * Accent colors for an element marked `data-accent-cards={accent.style}`.
 * Every card inside it (anything using the card background) is recolored by
 * the rules in globals.css. Content outside cards is left alone.
 *
 * Solid cards are filled with the accent, with text, surfaces and borders
 * derived from it. Glass and transparent cards are translucent tints that keep
 * the theme's text: transparent is a faint see-through wash; glass is a
 * frosted pane (blur, sheen and a light rim, in globals.css). Over a plain
 * page both keep theme text at WCAG AA in every theme, sheen included.
 */
export function accentCardTheme({
  color,
  gradient,
  style,
}: Accent): CSSProperties {
  // The midpoint stands in for a gradient where one color is needed.
  const base = gradient ? `color-mix(in srgb, ${color}, ${gradient})` : color;
  const fill = (hex: string) =>
    style === "glass"
      ? `color-mix(in srgb, color-mix(in srgb, ${hex} 35%, var(--color-primary-bg)) 60%, transparent)`
      : style === "transparent"
        ? `color-mix(in srgb, ${hex} 15%, transparent)`
        : hex;
  const background: Record<string, string> = gradient
    ? {
        "--accent-card-gradient": `linear-gradient(135deg, ${fill(color)}, ${fill(gradient)})`,
        // Only the gradient fills the card, so translucent fills don't stack.
        "--accent-card-surface": "transparent",
      }
    : {};

  if (style !== "solid") {
    // Surfaces are translucent layers of the theme text over the tint.
    const overlay = (amount: number) =>
      `color-mix(in srgb, var(--color-primary-text) ${amount}%, transparent)`;
    return {
      "--accent-card-bg": fill(base),
      ...background,
      "--accent-card-tertiary": overlay(12),
      "--accent-card-quaternary": overlay(20),
      // Glass gets a light rim, like the edge of a pane.
      "--accent-card-border":
        style === "glass"
          ? `color-mix(in srgb, color-mix(in srgb, ${base} 40%, white) 55%, transparent)`
          : overlay(28),
      "--accent-card-text-secondary": overlay(80),
    } as CSSProperties;
  }

  const text = gradient
    ? readableTextColor(color, gradient)
    : readableTextColor(color);
  const mix = (amount: number) =>
    `color-mix(in srgb, ${base} ${100 - amount}%, ${text})`;
  return {
    "--accent-card-bg": base,
    ...background,
    "--accent-card-tertiary": mix(12),
    "--accent-card-quaternary": mix(20),
    "--accent-card-border": mix(28),
    "--accent-card-text": text,
    "--accent-card-text-secondary": `color-mix(in srgb, ${text} 72%, ${base})`,
  } as CSSProperties;
}

export interface Hsv {
  h: number; // 0-360
  s: number; // 0-1
  v: number; // 0-1
}

export function hexToHsv(hex: string): Hsv {
  const [r, g, b] = [1, 3, 5].map(
    (i) => parseInt(hex.slice(i, i + 2), 16) / 255,
  );
  const max = Math.max(r, g, b);
  const delta = max - Math.min(r, g, b);
  let h = 0;
  if (delta) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
  }
  return { h: (h * 60 + 360) % 360, s: max ? delta / max : 0, v: max };
}

export function hsvToHex({ h, s, v }: Hsv): string {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return `#${[f(5), f(3), f(1)]
    .map((c) =>
      Math.round(c * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}
