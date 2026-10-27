import { readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const icons = readdirSync(new URL("../public/robbery_icons/", import.meta.url), {
  withFileTypes: true,
})
  .filter((entry) => entry.isFile() && /\.(png|webp|svg)$/i.test(entry.name))
  .map((entry) => entry.name)
  .sort();

const entries = await Promise.all(icons.map(async (file) => {
  const pixels = await sharp(fileURLToPath(new URL(`../public/robbery_icons/${encodeURIComponent(file)}`, import.meta.url)))
    .toColourspace("srgb")
    .ensureAlpha()
    .raw()
    .toBuffer();
  let brightness = 0;
  let opacity = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    brightness += (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3 * pixels[i + 3];
    opacity += pixels[i + 3];
  }
  return { file, maskMode: brightness > opacity * 127 ? "luminance" : "alpha" };
}));

writeFileSync(
  new URL("../src/lib/robbery-icons.generated.json", import.meta.url),
  JSON.stringify(entries, null, 2) + "\n",
);
