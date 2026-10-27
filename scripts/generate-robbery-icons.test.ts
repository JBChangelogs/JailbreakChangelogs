import { expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("new matching image files are discovered without changing code", () => {
  const root = mkdtempSync(join(tmpdir(), "jbcl-robbery-icons-"));
  try {
    for (const directory of ["scripts", "src/lib", "public/robbery_icons"]) {
      mkdirSync(join(root, directory), { recursive: true });
    }
    copyFileSync(new URL("./generate-robbery-icons.ts", import.meta.url), join(root, "scripts/generate-robbery-icons.ts"));
    symlinkSync(fileURLToPath(new URL("../node_modules", import.meta.url)), join(root, "node_modules"), "dir");
    copyFileSync(new URL("../public/robbery_icons/Bank.png", import.meta.url), join(root, "public/robbery_icons/Future_Robbery.png"));
    copyFileSync(new URL("../public/robbery_icons/Grocery_Store.png", import.meta.url), join(root, "public/robbery_icons/Black_Icon.png"));
    writeFileSync(join(root, "public/robbery_icons/README.md"), "ignored");
    mkdirSync(join(root, "public/robbery_icons/folder.png"));
    const result = spawnSync(process.execPath, ["scripts/generate-robbery-icons.ts"], { cwd: root, encoding: "utf8" });
    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(readFileSync(join(root, "src/lib/robbery-icons.generated.json"), "utf8"))).toEqual([
      { file: "Black_Icon.png", maskMode: "alpha" },
      { file: "Future_Robbery.png", maskMode: "luminance" },
    ]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
