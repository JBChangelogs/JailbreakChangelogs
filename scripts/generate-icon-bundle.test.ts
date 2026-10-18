import { expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("icon credits follow used sets, ignore generated/test sources, and require notices", () => {
  const root = mkdtempSync(join(tmpdir(), "jbcl-icon-credits-"));
  try {
    for (const directory of ["scripts", "src/lib", "node_modules/@iconify-json", "public/licenses/icons"]) {
      mkdirSync(join(root, directory), { recursive: true });
    }
    copyFileSync(new URL("./generate-icon-bundle.ts", import.meta.url), join(root, "scripts/generate-icon-bundle.ts"));
    symlinkSync(new URL("../node_modules/@iconify", import.meta.url).pathname, join(root, "node_modules/@iconify"), "dir");
    for (const prefix of ["fixture-a", "fixture-b", "unused"]) {
      const directory = join(root, "node_modules/@iconify-json", prefix);
      mkdirSync(directory);
      writeFileSync(join(directory, "icons.json"), JSON.stringify({ prefix, width: 24, height: 24, icons: { icon: { body: '<path d="M0 0h24v24H0z"/>' } } }));
      writeFileSync(join(directory, "info.json"), JSON.stringify({
        name: prefix,
        author: { name: "Fixture author", url: "https://example.com/author" },
        license: { title: "MIT", url: "https://example.com/LICENSE" },
      }));
      writeFileSync(join(root, "public/licenses/icons", `${prefix}.txt`), "Fixture license notice");
    }
    const source = join(root, "src/icons.ts");
    const creditsFile = join(root, "src/lib/icon-credits.generated.json");
    const bundle = join(root, "src/lib/icon-bundle.generated.ts");
    const run = () => spawnSync(process.execPath, ["scripts/generate-icon-bundle.ts"], { cwd: root, encoding: "utf8" });
    writeFileSync(source, 'const icons = ["fixture-b:icon", "fixture-a:icon", "fixture-a:icon"];');
    writeFileSync(join(root, "src/icons.test.ts"), 'const icon = "unused:icon";');
    let result = run();
    expect(result.status, result.stderr).toBe(0);
    let credits = JSON.parse(readFileSync(creditsFile, "utf8"));
    expect(credits.map((credit: { prefix: string }) => credit.prefix)).toEqual(["fixture-a", "fixture-b"]);
    expect(credits[0].author.name).toBe("Fixture author");
    expect(credits[0].license.url).toBe("https://example.com/LICENSE");

    writeFileSync(source, 'const icon = "fixture-b:icon";');
    result = run();
    expect(result.status, result.stderr).toBe(0);
    credits = JSON.parse(readFileSync(creditsFile, "utf8"));
    expect(credits.map((credit: { prefix: string }) => credit.prefix)).toEqual(["fixture-b"]);
    expect(readFileSync(bundle, "utf8")).not.toContain("fixture-a");

    const notice = join(root, "public/licenses/icons/fixture-b.txt");
    unlinkSync(notice);
    result = run();
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Missing license notice");
    writeFileSync(notice, "Fixture notice restored");
    writeFileSync(join(root, "node_modules/@iconify-json/fixture-b/info.json"), JSON.stringify({ name: "Missing author and license" }));
    result = run();
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Missing author or license metadata");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
