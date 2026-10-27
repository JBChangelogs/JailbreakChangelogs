/**
 * Drop unused role badge colors and editable market text; derive text for display.
 * Self-contained so the same code also runs before hydration.
 */
export function marketThemeVars(
  vars: Record<string, string>,
  textColor?: (hex: string) => string,
): Record<string, string> {
  const colors = Object.fromEntries(
    Object.entries(vars).filter(
      ([key]) =>
        !key.startsWith("--color-badge-") &&
        !/^--color-(demand|trend)-.+-text$/.test(key),
    ),
  );
  if (!textColor) return colors;
  let canvas: CanvasRenderingContext2D | null | undefined;
  const resolve = (value: string) => {
    for (let i = 0; i < 8 && value.includes("var("); i++) {
      value = value.replace(
        /var\((--color-[a-z0-9-]+)\)/g,
        (match, key) => colors[key] ?? match,
      );
    }
    return value;
  };
  for (const [key, value] of Object.entries(colors)) {
    if (!/^--color-(demand|trend)-[a-z-]+$/.test(key)) continue;
    let hex = resolve(value);
    if (!/^#[0-9a-f]{6}$/i.test(hex)) {
      if (typeof document === "undefined") continue;
      canvas ??= document.createElement("canvas").getContext("2d");
      if (!canvas) continue;
      // Composite translucent colors over the theme's card background.
      canvas.fillStyle = "#ffffff";
      canvas.fillRect(0, 0, 1, 1);
      for (const background of [
        colors["--color-primary-bg"],
        colors["--color-secondary-bg"],
        hex,
      ]) {
        if (!background) continue;
        canvas.fillStyle = resolve(background);
        canvas.fillRect(0, 0, 1, 1);
      }
      const [r, g, b] = canvas.getImageData(0, 0, 1, 1).data;
      hex = `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
    }
    colors[`${key}-text`] = textColor(hex);
  }
  return colors;
}
