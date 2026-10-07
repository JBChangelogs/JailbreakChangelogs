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

/** Black or white, whichever contrasts more with `hex` (WCAG). */
export function readableTextColor(hex: string): "#000000" | "#ffffff" {
  const l = luminance(hex);
  return (l + 0.05) / 0.05 > 1.05 / (l + 0.05) ? "#000000" : "#ffffff";
}

/**
 * Accent colors for an element marked `data-accent-cards`. Every card inside
 * it (anything using the card background) is recolored by the rule in
 * globals.css: the accent becomes the card background, with text, surfaces
 * and borders derived from it. Content outside cards is left alone.
 */
export function accentCardTheme(hex: string): CSSProperties {
  const text = readableTextColor(hex);
  const mix = (amount: number) =>
    `color-mix(in srgb, ${hex} ${100 - amount}%, ${text})`;
  return {
    "--accent-card-bg": hex,
    "--accent-card-tertiary": mix(12),
    "--accent-card-quaternary": mix(20),
    "--accent-card-border": mix(28),
    "--accent-card-text": text,
    "--accent-card-text-secondary": `color-mix(in srgb, ${text} 72%, ${hex})`,
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
