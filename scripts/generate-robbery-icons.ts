import { readdirSync, writeFileSync } from "node:fs";

const icons = readdirSync(new URL("../public/robbery_icons/", import.meta.url), {
  withFileTypes: true,
})
  .filter((entry) => entry.isFile() && /\.(png|webp|svg)$/i.test(entry.name))
  .map((entry) => entry.name)
  .sort();

writeFileSync(
  new URL("../src/lib/robbery-icons.generated.json", import.meta.url),
  JSON.stringify(icons, null, 2) + "\n",
);
