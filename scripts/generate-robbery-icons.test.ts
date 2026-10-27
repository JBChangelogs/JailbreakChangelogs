import { expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("new matching image files are discovered without changing code", () => {
  const root = mkdtempSync(join(tmpdir(), "jbcl-robbery-icons-"));
  try {
    for (const directory of ["scripts", "src/lib", "public/robbery_icons"]) {
      mkdirSync(join(root, directory), { recursive: true });
    }
    copyFileSync(new URL("./generate-robbery-icons.ts", import.meta.url), join(root, "scripts/generate-robbery-icons.ts"));
    writeFileSync(join(root, "public/robbery_icons/Future_Robbery.png"), "fixture");
    writeFileSync(join(root, "public/robbery_icons/README.md"), "ignored");
    mkdirSync(join(root, "public/robbery_icons/folder.png"));
    const result = spawnSync(process.execPath, ["scripts/generate-robbery-icons.ts"], { cwd: root, encoding: "utf8" });
    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(readFileSync(join(root, "src/lib/robbery-icons.generated.json"), "utf8"))).toEqual(["Future_Robbery.png"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
